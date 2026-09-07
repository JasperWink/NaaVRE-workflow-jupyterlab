import * as Y from 'yjs';

import { Workflow } from '../model';
import { cellToChartNode, defaultChart, IChart } from './chart';
import { makeDraftCell } from './specialCells';

function chartWith(nodeIds: string[], links: IChart['links'] = {}): IChart {
  const nodes: IChart['nodes'] = {};
  for (const id of nodeIds) {
    const cell = makeDraftCell({
      title: id,
      url: id,
      outputs: [{ name: 'out', type: 'str' }]
    });
    nodes[id] = cellToChartNode(cell);
  }
  return { ...defaultChart, nodes, links };
}

/** Keys held in the shared document's `content` map. */
function keysOf(wf: Workflow): string[] {
  return Array.from(wf.ydoc.getMap('content').keys()).sort();
}

describe('Workflow (shared model)', () => {
  it('stores exactly one key per node and link', () => {
    const wf = new Workflow();
    wf.setChart(
      chartWith(['a', 'b'], {
        l1: {
          id: 'l1',
          from: { nodeId: 'a', portId: 'out' },
          to: { nodeId: 'b', portId: 'out' }
        }
      })
    );
    expect(keysOf(wf)).toEqual(['link:l1', 'node:a', 'node:b', 'properties']);
  });

  it('round-trips nodes and links', () => {
    const wf = new Workflow();
    const chart = chartWith(['a', 'b'], {
      l1: {
        id: 'l1',
        from: { nodeId: 'a', portId: 'out' },
        to: { nodeId: 'b', portId: 'out' }
      }
    });
    wf.setChart(chart);
    const out = wf.getChart();
    expect(Object.keys(out.nodes).sort()).toEqual(['a', 'b']);
    expect(out.links).toEqual(chart.links);
    expect(out.nodes['a']).toEqual(chart.nodes['a']);
  });

  it('never stores view state (pan, zoom, selection, hover)', () => {
    const wf = new Workflow();
    wf.setChart({
      ...chartWith(['a']),
      offset: { x: -120, y: 42 },
      scale: 1.5,
      selected: { type: 'node', id: 'a' },
      hovered: { type: 'node', id: 'a' }
    });
    // Only the node and chart-property keys are written: view state is
    // per-client and never stored.
    expect(keysOf(wf)).toEqual(['node:a', 'properties']);
    const out = wf.getChart();
    expect(out.offset).toEqual(defaultChart.offset);
    expect(out.scale).toBe(defaultChart.scale);
    expect(out.selected).toEqual({});
    expect(out.hovered).toEqual({});
  });

  it('removes the keys of deleted nodes and links', () => {
    const wf = new Workflow();
    wf.setChart(chartWith(['a', 'b']));
    wf.setChart(chartWith(['b']));
    expect(keysOf(wf)).toEqual(['node:b', 'properties']);
    expect(Object.keys(wf.getChart().nodes)).toEqual(['b']);
  });

  it('does not emit a change for a no-op write', () => {
    const wf = new Workflow();
    const chart = chartWith(['a']);
    wf.setChart(chart);
    let changes = 0;
    wf.changed.connect(() => {
      changes += 1;
    });
    wf.setChart(chart);
    expect(changes).toBe(0);
  });

  it('serializes to and from the on-disk format', () => {
    const wf = new Workflow();
    wf.setChart(chartWith(['a', 'b']));
    const source = wf.getSource();
    expect(JSON.parse(source)).toHaveProperty('chart');

    const wf2 = new Workflow();
    wf2.setSource(source);
    expect(wf2.getChart().nodes).toEqual(wf.getChart().nodes);
    expect(wf2.getChart().links).toEqual(wf.getChart().links);
    expect(wf2.getChart().properties).toEqual(wf.getChart().properties);
  });

  it('stores chart-level params, not just nodes and links', () => {
    const params = [
      { node_id: 'a', name: 'threshold', value: '42', type: 'int' as const }
    ];
    const wf = new Workflow();
    wf.setChart({ ...chartWith(['a']), properties: { params } });
    expect(wf.getChart().properties.params).toEqual(params);
  });

  it('preserves chart-level params across a save/load round trip', () => {
    const params = [
      { node_id: 'a', name: 'threshold', value: '42', type: 'int' as const }
    ];
    const wf = new Workflow();
    // Already version-stamped; without it migrations reset properties.params.
    wf.setChart({
      ...chartWith(['a']),
      properties: { params },
      metadata: { version: '1.1' }
    } as IChart);

    const wf2 = new Workflow();
    wf2.setSource(wf.getSource());
    expect(wf2.getChart().properties.params).toEqual(params);
  });

  it('migrates a legacy chart on load, before splitting into keys', () => {
    // A pre-migration document: no `metadata`, and a splitter without
    // `param_max_branches` (see utils/chartMigrations).
    const legacy = JSON.stringify({
      chart: {
        offset: { x: 0, y: 0 },
        scale: 1,
        nodes: {
          s1: {
            id: 's1',
            type: 'splitter',
            position: { x: 0, y: 0 },
            ports: {},
            properties: { cell: { title: 'Splitter', params: [] } }
          }
        },
        links: {},
        selected: {},
        hovered: {}
      }
    });
    const wf = new Workflow();
    wf.setSource(legacy);
    const chart = wf.getChart() as Record<string, any>;
    expect(chart.metadata).toBeDefined();
    expect(chart.nodes.s1.properties.cell.params).toContainEqual(
      expect.objectContaining({ name: 'param_max_branches' })
    );
  });

  it('degrades to the default chart on a corrupt file', () => {
    const wf = new Workflow();
    expect(() => wf.setSource('{not json')).not.toThrow();
    expect(wf.getChart().nodes).toEqual({});
    expect(wf.getChart().offset).toEqual(defaultChart.offset);
  });

  it('only rewrites the key of the node that changed', () => {
    const wf = new Workflow();
    wf.setChart(chartWith(['a', 'b']));
    const content = wf.ydoc.getMap('content');
    const untouched = content.get('node:b');

    const moved = wf.getChart();
    moved.nodes['a'] = {
      ...moved.nodes['a'],
      position: { x: 999, y: 999 }
    };
    wf.setChart(moved);

    // b's serialized value is identical, i.e. it was never re-written.
    expect(content.get('node:b')).toBe(untouched);
    expect(wf.getChart().nodes['a'].position).toEqual({ x: 999, y: 999 });
  });

  it('merges concurrent edits to different nodes instead of clobbering', () => {
    // Two clients start from the same document.
    const alice = new Workflow();
    alice.setChart(chartWith(['a', 'b']));
    const bob = new Workflow();
    Y.applyUpdate(bob.ydoc, Y.encodeStateAsUpdate(alice.ydoc));

    // Each moves a *different* node, without seeing the other's edit.
    const aChart = alice.getChart();
    aChart.nodes['a'] = {
      ...aChart.nodes['a'],
      position: { x: 100, y: 100 }
    };
    alice.setChart(aChart);

    const bChart = bob.getChart();
    bChart.nodes['b'] = { ...bChart.nodes['b'], position: { x: 200, y: 200 } };
    bob.setChart(bChart);

    // Exchange updates both ways.
    Y.applyUpdate(
      bob.ydoc,
      Y.encodeStateAsUpdate(alice.ydoc, Y.encodeStateVector(bob.ydoc))
    );
    Y.applyUpdate(
      alice.ydoc,
      Y.encodeStateAsUpdate(bob.ydoc, Y.encodeStateVector(alice.ydoc))
    );

    // Both edits survive on both clients.
    for (const wf of [alice, bob]) {
      const chart = wf.getChart();
      expect(chart.nodes['a'].position).toEqual({ x: 100, y: 100 });
      expect(chart.nodes['b'].position).toEqual({ x: 200, y: 200 });
    }
  });
});
