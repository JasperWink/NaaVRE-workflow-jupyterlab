// Concurrent editing: a client writes what it changed, not the chart it holds.
// See mergeChartChanges (utils/chart.ts) and _syncDocumentToModel (widget.tsx).

import * as Y from 'yjs';

import { Workflow } from '../model';
import {
  ChartContent,
  defaultChart,
  IChart,
  INode,
  mergeChartChanges
} from './chart';

function node(id: string, x = 10): INode {
  return {
    id,
    type: 'workflow-cell',
    position: { x, y: 10 },
    properties: { cell: { url: id, title: id } },
    ports: {},
    size: { width: 252, height: 61 }
  } as unknown as INode;
}

function content(nodes: INode[]): ChartContent {
  return {
    nodes: Object.fromEntries(nodes.map(n => [n.id, n])),
    links: {}
  };
}

function chart(c: ChartContent): IChart {
  return { ...defaultChart, ...c };
}

describe('mergeChartChanges', () => {
  it('keeps an element another client added while the edit was pending', () => {
    const base = content([node('n1')]);
    const local = content([node('n1', 99)]); // the local user moved n1
    const remote = content([node('n1'), node('n2')]); // someone added n2

    const merged = mergeChartChanges(base, local, remote);

    expect(Object.keys(merged.nodes).sort()).toEqual(['n1', 'n2']);
    expect(merged.nodes.n1.position.x).toBe(99);
  });

  it('applies an element the local user added', () => {
    const base = content([node('n1')]);
    const merged = mergeChartChanges(
      base,
      content([node('n1'), node('n2')]),
      base
    );
    expect(Object.keys(merged.nodes).sort()).toEqual(['n1', 'n2']);
  });

  it('applies an element the local user deleted', () => {
    const base = content([node('n1'), node('n2')]);
    const merged = mergeChartChanges(base, content([node('n1')]), base);
    expect(Object.keys(merged.nodes)).toEqual(['n1']);
  });

  it('leaves an element the local user did not touch as the remote has it', () => {
    const base = content([node('n1')]);
    const merged = mergeChartChanges(
      base,
      content([node('n1')]),
      content([node('n1', 42)]) // moved by someone else
    );
    expect(merged.nodes.n1.position.x).toBe(42);
  });

  it('is a no-op when nothing changed anywhere', () => {
    const base = content([node('n1'), node('n2')]);
    expect(mergeChartChanges(base, base, base)).toEqual(base);
  });
});

describe('an edit that mutates the chart in place', () => {
  // react-flow-chart mutates the chart it is handed; this is what a drag does.
  function dragInPlace(c: ChartContent, id: string, dx: number): void {
    const n = c.nodes[id];
    c.nodes[id] = {
      ...n,
      position: { x: n.position.x + dx, y: n.position.y }
    } as INode;
  }

  it('still produces an update when the base is a copy', () => {
    const shared = content([node('n1')]);

    // What the widget does: the composer and the base each get their own copy,
    // never the model's object.
    const forComposer: ChartContent = JSON.parse(JSON.stringify(shared));
    const base: ChartContent = JSON.parse(JSON.stringify(shared));

    dragInPlace(forComposer, 'n1', 50);

    const merged = mergeChartChanges(base, forComposer, shared);
    expect(merged.nodes.n1.position.x).toBe(60);
    expect(merged).not.toEqual(shared);
  });

  it('produces nothing when the base aliases what the drag mutated', () => {
    // Guards the bug where base and composer share an object, so the diff
    // comes out empty.
    const shared = content([node('n1')]);
    const aliased = shared; // what handing out the model's cache looked like

    dragInPlace(aliased, 'n1', 50);

    const merged = mergeChartChanges(aliased, aliased, shared);
    expect(merged).toEqual(shared); // nothing to write -- the edit is lost
  });
});

describe('two clients editing the same workflow', () => {
  /** Two shared models wired as the collaboration room wires them. */
  function room(): [Workflow, Workflow] {
    const A = new Workflow();
    const B = new Workflow();
    const a = (A as any).ydoc as Y.Doc;
    const b = (B as any).ydoc as Y.Doc;
    a.on('update', (u: Uint8Array) => Y.applyUpdate(b, u));
    b.on('update', (u: Uint8Array) => Y.applyUpdate(a, u));
    return [A, B];
  }

  /** What the widget does when a client's debounced edit flushes. */
  function flush(
    model: Workflow,
    base: ChartContent,
    local: ChartContent,
    properties?: IChart['properties']
  ) {
    const current = model.getChart();
    const merged = mergeChartChanges(base, local, current);
    model.setChart({
      ...current,
      nodes: merged.nodes,
      links: merged.links,
      properties: properties ?? current.properties
    });
  }

  it('does not delete a node added while the other client was dragging', () => {
    const [A, B] = room();
    A.setChart(chart(content([node('n1')])));

    // A starts dragging n1; this snapshot is what its debounce captured.
    const aBase = content([node('n1')]);
    const aLocal = content([node('n1', 99)]);

    // Before A's debounce fires, B adds n2 and it reaches A.
    B.setChart(chart(content([node('n1'), node('n2')])));
    expect(Object.keys(A.getChart().nodes).sort()).toEqual(['n1', 'n2']);

    // A's stale snapshot flushes.
    flush(A, aBase, aLocal);

    // Both clients keep both nodes, and A's move is applied.
    expect(Object.keys(A.getChart().nodes).sort()).toEqual(['n1', 'n2']);
    expect(Object.keys(B.getChart().nodes).sort()).toEqual(['n1', 'n2']);
    expect(B.getChart().nodes.n1.position.x).toBe(99);
  });

  it('syncs chart-level params to the other client', () => {
    const [A, B] = room();
    A.setChart(chart(content([node('n1')])));

    const base = content([node('n1')]);
    flush(A, base, base, {
      params: [{ node_id: 'n1', name: 'threshold', value: '42' }]
    });

    expect(B.getChart().properties.params).toEqual([
      { node_id: 'n1', name: 'threshold', value: '42' }
    ]);
  });

  it('still propagates a real deletion', () => {
    const [A, B] = room();
    A.setChart(chart(content([node('n1'), node('n2')])));

    const aBase = content([node('n1'), node('n2')]);
    flush(A, aBase, content([node('n1')])); // A deleted n2

    expect(Object.keys(B.getChart().nodes)).toEqual(['n1']);
  });
});
