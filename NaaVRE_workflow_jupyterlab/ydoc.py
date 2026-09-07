# Copyright (c) NaaVRE contributors.
# Distributed under the terms of the Modified BSD License.

"""Server-side shared document for NaaVRE ``.naavrewf`` workflow files.

``jupyter_server_ydoc`` looks up the server-side document class by file type::

    self._document = YDOCS.get(self._file_type, YFILE)(self.ydoc, self.awareness)

where ``YDOCS`` comes from the ``jupyter_ydoc`` entry-point group. Our file type
is ``naavrewfdoc``; without a registered class the server falls back to the
generic ``YFile`` (a single ``Y.Text``), which does not match the front-end
structure and silently stops syncing.

The CRDT layout mirrors ``Workflow`` in ``src/model.ts``: a ``pycrdt.Map`` named
``content`` holding one JSON string per node (``node:<id>``) and per link
(``link:<id>``), plus the chart-level ``properties`` and ``metadata`` keys.
"""

import json
import sys
from functools import partial
from typing import Any, Callable, Optional

from pycrdt import Awareness, Doc, Map

try:
    from jupyter_ydoc.ybasedoc import YBaseDoc
except AttributeError:
    # Re-entrant import: jupyter_ydoc loads this entry point before YWorkflow
    # exists, so take the already-imported base class directly.
    YBaseDoc = sys.modules["jupyter_ydoc.ybasedoc"].YBaseDoc

# Mirrors ``defaultChart`` in ``src/utils/chart.ts``.
DEFAULT_CHART = {
    "offset": {"x": 0, "y": 0},
    "scale": 1,
    "nodes": {},
    "links": {},
    "properties": {"params": []},
    "selected": {},
    "hovered": {},
}


def _parse_json(raw: Any, fallback: Any) -> Any:
    """``json.loads`` that degrades to a fallback instead of raising."""
    try:
        return json.loads(raw) if raw else fallback
    except (TypeError, ValueError):
        return fallback


class YWorkflow(YBaseDoc):
    """A :class:`YBaseDoc` for NaaVRE ``.naavrewf`` workflow documents.

    Storing each node and link under its own key lets Yjs merge concurrent
    edits to different elements instead of last-write-wins on the whole chart.
    View state (pan, zoom, selection, hover) is per-client and never stored.
    """

    _NODE_PREFIX = "node:"
    _LINK_PREFIX = "link:"
    _PROPERTIES_KEY = "properties"
    _METADATA_KEY = "metadata"

    def __init__(
        self, ydoc: Optional[Doc] = None, awareness: Optional[Awareness] = None
    ):
        super().__init__(ydoc, awareness)
        self._ycontent = self._ydoc.get("content", type=Map)

    @property
    def version(self) -> str:
        """Document version, kept in sync with ``Workflow.version``."""
        return "1.0.0"

    def _get_chart(self) -> dict:
        """Reassemble the chart from the granular content keys."""
        nodes = {}
        links = {}
        chart = {**DEFAULT_CHART, "nodes": nodes, "links": links}
        for key in self._ycontent.keys():
            value = self._ycontent.get(key)
            if key.startswith(self._NODE_PREFIX):
                node = _parse_json(value, None)
                if node is not None:
                    nodes[key[len(self._NODE_PREFIX):]] = node
            elif key.startswith(self._LINK_PREFIX):
                link = _parse_json(value, None)
                if link is not None:
                    links[key[len(self._LINK_PREFIX):]] = link
            elif key == self._PROPERTIES_KEY:
                chart[self._PROPERTIES_KEY] = _parse_json(
                    value, DEFAULT_CHART["properties"]
                )
            elif key == self._METADATA_KEY:
                metadata = _parse_json(value, None)
                if metadata is not None:
                    chart[self._METADATA_KEY] = metadata
        return chart

    def get(self) -> str:
        """Serialize to the on-disk ``.naavrewf`` string.

        Produces the same ``{"chart": ...}`` JSON the front-end writes, so files
        stay identical whether saved with or without collaboration enabled.
        """
        return json.dumps({"chart": self._get_chart()}, indent=2)

    def set(self, value: str) -> None:
        """Populate the shared document from the on-disk ``.naavrewf`` string.

        Writes only the keys that changed and drops the keys of elements that
        are no longer present.
        """
        contents = _parse_json(value, {})
        chart = contents.get("chart") if isinstance(contents, dict) else None
        if not isinstance(chart, dict):
            chart = DEFAULT_CHART

        desired = {}
        nodes = chart.get("nodes")
        if isinstance(nodes, dict):
            for node_id, node in nodes.items():
                desired[f"{self._NODE_PREFIX}{node_id}"] = json.dumps(node)
        links = chart.get("links")
        if isinstance(links, dict):
            for link_id, link in links.items():
                desired[f"{self._LINK_PREFIX}{link_id}"] = json.dumps(link)
        desired[self._PROPERTIES_KEY] = json.dumps(
            chart.get("properties", DEFAULT_CHART["properties"])
        )
        if chart.get("metadata") is not None:
            desired[self._METADATA_KEY] = json.dumps(chart["metadata"])

        with self._ydoc.transaction():
            for key in list(self._ycontent.keys()):
                if key not in desired:
                    del self._ycontent[key]
            for key, val in desired.items():
                if self._ycontent.get(key) != val:
                    self._ycontent[key] = val

    def observe(self, callback: Callable[[str, Any], None]) -> None:
        """Subscribe to document changes (state + content)."""
        self.unobserve()
        self._subscriptions[self._ystate] = self._ystate.observe(
            partial(callback, "state")
        )
        self._subscriptions[self._ycontent] = self._ycontent.observe(
            partial(callback, "content")
        )
