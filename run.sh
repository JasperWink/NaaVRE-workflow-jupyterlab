#!/usr/bin/env bash
#
# Start the backing services and JupyterLab with the NaaVRE workflow extension.
#
#   ./run.sh          Services up, install, build, launch on http://127.0.0.1:8888
#   ./run.sh --down   Stop the backing services and exit.
#
# This repo owns dev/docker-compose.yaml, so it brings the services up.
# NAAVRE_VENV and NAAVRE_SETUP_ONLY let the top-level NaaVRE-implementation/
# run.sh drive this script; see that script for why one environment is shared.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
DEV="$ROOT/dev"
VENV="${NAAVRE_VENV:-$ROOT/venv}"

say() { printf '\033[1;34m==> [workflow]\033[0m %s\n' "$*"; }

# Compose runs from dev/ because the services mount config by relative path.
compose() {
  local files=(-f docker-compose.yaml)
  [ -f "$DEV/docker-compose.local.yaml" ] && files+=(-f docker-compose.local.yaml)
  (cd "$DEV" && docker compose "${files[@]}" "$@")
}

if [ "${1:-}" = "--down" ]; then
  say "Stopping backing services"
  compose down
  exit 0
fi
[ $# -eq 0 ] || { echo "usage: $0 [--down]" >&2; exit 1; }

if ! docker info > /dev/null 2>&1; then
  echo "Docker is not usable. Install it and start the daemon, then re-run." >&2
  exit 1
fi
say "Starting backing services"
compose up -d

# Yarn 3 falls back to Plug'n'Play without this, which breaks
# `jupyter labextension build`.
[ -f .yarnrc.yml ] || echo "nodeLinker: node-modules" > .yarnrc.yml
rm -f .pnp.cjs .pnp.loader.mjs

PYTHON="${PYTHON:-python3}"
if [ ! -d "$VENV" ]; then
  say "Creating $VENV (this takes a few minutes)"
  "$PYTHON" -m venv "$VENV"
  "$VENV/bin/python" -m pip install --upgrade pip wheel 'jupyterlab>=4.0.0,<5'
fi

# Checked on every run, not just at creation: an older venv left over from a
# previous setup would fail the collaboration install with a confusing error.
if ! "$VENV/bin/python" -c 'import sys; sys.exit(sys.version_info < (3, 10))'; then
  echo "$VENV runs $("$VENV/bin/python" -V 2>&1); jupyter-collaboration needs 3.10+." >&2
  echo "Delete it and re-run as: PYTHON=python3.12 $0" >&2
  exit 1
fi
export PATH="$VENV/bin:$PATH"

sha() {
  "$VENV/bin/python" -c \
    "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" "$1"
}

# `pip install -e` writes install.json into the source tree once the labextension
# path is symlinked, and hatchling then sees that path twice and refuses to build.
rm -f NaaVRE_workflow_jupyterlab/labextension/install.json

# Entry points register at install time, so reinstall when packaging changes: a
# stale jupyter_ydoc entry point stops syncing without any error.
STAMP="$VENV/.workflow-pyproject.sha256"
if ! "$VENV/bin/python" -c 'import NaaVRE_workflow_jupyterlab' 2>/dev/null \
  || [ "$(cat "$STAMP" 2>/dev/null)" != "$(sha pyproject.toml)" ]; then
  say "Installing the extension into $(basename "$VENV")"
  "$VENV/bin/python" -m pip install -e '.[collaboration]'
  sha pyproject.toml > "$STAMP"
fi

# Unguarded on purpose: `pip install -e` COPIES the built labextension, so later
# rebuilds stay invisible until this replaces the copy with a symlink.
"$VENV/bin/jupyter" labextension develop . --overwrite > /dev/null

PKG_STAMP="node_modules/.package-json.sha256"
if [ ! -d node_modules ] || [ "$(cat "$PKG_STAMP" 2>/dev/null)" != "$(sha package.json)" ]; then
  say "Installing node dependencies"
  jlpm install
  sha package.json > "$PKG_STAMP"
fi

# Point the extensions at the local services. Merged, never copied over: the
# file is shared, and clobbering the containerizer's URLs breaks it silently.
mkdir -p "$VENV/share/jupyter/lab/settings"
"$VENV/bin/python" - "$VENV/share/jupyter/lab/settings/overrides.json" \
  "$DEV/overrides.json" "$DEV/overrides.local.json" <<'MERGE'
import json, pathlib, sys
target, *sources = sys.argv[1:]
t = pathlib.Path(target)
merged = json.loads(t.read_text()) if t.exists() else {}
for src in sources:
    p = pathlib.Path(src)
    if p.exists():
        for plugin, settings in json.loads(p.read_text()).items():
            merged.setdefault(plugin, {}).update(settings)
t.write_text(json.dumps(merged, indent=2) + "\n")
MERGE

say "Building"
jlpm build

if [ -n "${NAAVRE_SETUP_ONLY:-}" ]; then
  say "Ready (not launching JupyterLab)"
  exit 0
fi

mkdir -p notebook-dir

# Long-lived fake token, allowed domains, SSL off.
while IFS= read -r line; do
  case "$line" in '' | \#*) continue ;; esac
  export "$line"
done < "$DEV/jupyterlab.env"
# The containerizer service only exists in the local compose overlay, so its
# host is not in the committed jupyterlab.env. Appended, not restated.
export NAAVRE_ALLOWED_DOMAINS="${NAAVRE_ALLOWED_DOMAINS:+${NAAVRE_ALLOWED_DOMAINS},}localhost:41918"

say "Extensions in this environment:"
jupyter labextension list 2>&1 | grep -E "naavre|collaboration" | sed 's/^/    /' || true

# --SQLiteYStore.db_path keeps the Yjs store here instead of the caller's cwd.
say "Starting JupyterLab on http://127.0.0.1:8888"
exec jupyter lab \
  --notebook-dir="$ROOT/notebook-dir" \
  --ip=127.0.0.1 \
  --port=8888 \
  --SQLiteYStore.db_path="$ROOT/.jupyter_ystore.db"
