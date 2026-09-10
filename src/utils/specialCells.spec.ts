import {
  DRAFT_CELL_TYPE,
  isSpecialNodeType,
  makeDraftCell,
  specialCells
} from './specialCells';
import {
  addCellNodeToChart,
  cellToChartNode,
  defaultChart,
  updateChartNodeCell
} from './chart';

describe('makeDraftCell', () => {
  test('produces a draft cell with the expected defaults', () => {
    const cell = makeDraftCell({ title: 'Step A' });
    expect(cell.type).toBe(DRAFT_CELL_TYPE);
    expect(cell.is_draft).toBe(true);
    expect(cell.container_image).toBeNull();
    expect(cell.title).toBe('Step A');
    expect(cell.url).toMatch(/^draft-cell-/);
  });

  test('generates unique urls', () => {
    const a = makeDraftCell({ title: 'A' });
    const b = makeDraftCell({ title: 'B' });
    expect(a.url).not.toBe(b.url);
  });

  test('reuses the url when provided (editing)', () => {
    const cell = makeDraftCell({ title: 'A', url: 'draft-cell-fixed' });
    expect(cell.url).toBe('draft-cell-fixed');
  });
});

describe('cellToChartNode for draft cells', () => {
  test('builds a draft-cell node with left/right ports from inputs/outputs', () => {
    const cell = makeDraftCell({
      title: 'Step A',
      inputs: [{ name: 'in1', type: 'str' }],
      outputs: [
        { name: 'out1', type: 'str' },
        { name: 'out2', type: 'int' }
      ]
    });
    const node = cellToChartNode(cell);
    expect(node.type).toBe(DRAFT_CELL_TYPE);
    expect(node.id).toBe(cell.url);
    expect(node.ports['in1'].type).toBe('left');
    expect(node.ports['out1'].type).toBe('right');
    expect(node.ports['out2'].type).toBe('right');
    expect(Object.keys(node.ports)).toHaveLength(3);
  });
});

describe('addCellNodeToChart', () => {
  test('adds the node keyed by url and selects it', () => {
    const cell = makeDraftCell({ title: 'Step A' });
    const chart = addCellNodeToChart(defaultChart, cell);
    expect(chart.nodes[cell.url]).toBeDefined();
    expect(chart.selected).toEqual({ type: 'node', id: cell.url });
    // does not mutate the shared default chart
    expect(Object.keys(defaultChart.nodes)).toHaveLength(0);
  });

  test('gives a second node a free id when the url is already taken', () => {
    // The special cells have fixed urls, so adding two splitters used to key
    // both on 'splitter' and silently drop the first.
    const splitter = specialCells.find(c => c.url === 'splitter')!;
    const chart = addCellNodeToChart(
      addCellNodeToChart(defaultChart, splitter),
      splitter
    );

    expect(Object.keys(chart.nodes).sort()).toEqual(['splitter', 'splitter-2']);
    expect(chart.selected).toEqual({ type: 'node', id: 'splitter-2' });
    // The cell itself is unchanged; only the node id is made unique.
    expect(chart.nodes['splitter-2'].properties.cell.url).toBe('splitter');
  });

  test('keeps looking until it finds a free id', () => {
    const splitter = specialCells.find(c => c.url === 'splitter')!;
    let chart = defaultChart;
    for (let i = 0; i < 3; i++) {
      chart = addCellNodeToChart(chart, splitter);
    }
    expect(Object.keys(chart.nodes).sort()).toEqual([
      'splitter',
      'splitter-2',
      'splitter-3'
    ]);
  });
});

describe('updateChartNodeCell', () => {
  test('recomputes ports and prunes links to removed ports', () => {
    const cell = makeDraftCell({
      title: 'Step A',
      inputs: [{ name: 'in1', type: 'str' }],
      outputs: [{ name: 'out1', type: 'str' }]
    });
    let chart = addCellNodeToChart(defaultChart, cell);
    const other = makeDraftCell({
      title: 'B',
      inputs: [{ name: 'b_in', type: 'str' }],
      url: 'other'
    });
    chart = {
      ...chart,
      nodes: { ...chart.nodes, other: cellToChartNode(other) },
      links: {
        l1: {
          id: 'l1',
          from: { nodeId: cell.url, portId: 'out1' },
          to: { nodeId: 'other', portId: 'b_in' }
        }
      }
    };

    const updated = makeDraftCell({
      title: 'Step A',
      inputs: [{ name: 'in1', type: 'str' }],
      outputs: [{ name: 'out_new', type: 'str' }],
      url: cell.url
    });
    const newChart = updateChartNodeCell(chart, cell.url, updated);

    expect(newChart.nodes[cell.url].ports['out_new']).toBeDefined();
    expect(newChart.nodes[cell.url].ports['out1']).toBeUndefined();
    expect(newChart.links['l1']).toBeUndefined();
  });

  test('keeps the node id and position, replaces the cell', () => {
    const cell = makeDraftCell({
      title: 'A',
      outputs: [{ name: 'o', type: 'str' }]
    });
    let chart = addCellNodeToChart(defaultChart, cell);
    const pos = chart.nodes[cell.url].position;

    const updated = makeDraftCell({
      title: 'A2',
      url: cell.url,
      outputs: [{ name: 'o', type: 'str' }]
    });
    chart = updateChartNodeCell(chart, cell.url, updated);

    expect(chart.nodes[cell.url].id).toBe(cell.url);
    expect(chart.nodes[cell.url].position).toEqual(pos);
    expect(chart.nodes[cell.url].properties.cell.title).toBe('A2');
  });
});

describe('isSpecialNodeType', () => {
  test('is true only for the fixed-size nodes', () => {
    expect(isSpecialNodeType('splitter')).toBe(true);
    expect(isSpecialNodeType('merger')).toBe(true);
  });

  test('is false for anything carrying user-defined I/O', () => {
    expect(isSpecialNodeType('workflow-cell')).toBe(false);
    expect(isSpecialNodeType(DRAFT_CELL_TYPE)).toBe(false);
  });

  test('treats a missing type as special, matching the old !== check', () => {
    expect(isSpecialNodeType(undefined)).toBe(true);
  });
});
