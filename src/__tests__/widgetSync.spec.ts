// The "draft node appears, then vanishes" report from the two-user test.
//
// A remote addition that lands inside the debounce window used to be deleted
// again by the local client's own flush: the flush carried the snapshot the
// composer had reported *before* the repaint, while `_base` had already moved
// forward to include the remote node, so the merge read it as a local delete.

import * as Y from 'yjs';

import { ExperimentManagerWidget } from '../widget';
import { Workflow, WorkflowModel } from '../model';
import { cellToChartNode, defaultChart, IChart } from '../utils/chart';
import { makeDraftCell } from '../utils/specialCells';

function nodeFor(id: string): IChart['nodes'][string] {
  return cellToChartNode(makeDraftCell({ title: id, url: id }));
}

function chartWith(ids: string[]): IChart {
  const nodes: IChart['nodes'] = {};
  for (const id of ids) {
    nodes[id] = nodeFor(id);
  }
  return { ...defaultChart, nodes, links: {} };
}

/**
 * Stands in for the mounted Composer: the widget only ever reaches it through
 * `state.chart` and a React-style shallow `setState`. `setChart` mirrors the
 * real one, so a test can drive the same updater form the editors use.
 */
function fakeComposer(chart: IChart) {
  return {
    state: { chart },
    setState(patch: any) {
      this.state = { ...this.state, ...patch };
    },
    setChart(next: IChart | ((prev: IChart | null) => IChart | null)) {
      this.setState({
        chart: typeof next === 'function' ? next(this.state.chart) : next
      });
    },
    setNodePresence() {
      /* presence is not under test */
    }
  };
}

async function makeWidget(initial: IChart) {
  const sharedModel = new Workflow();
  sharedModel.setChart(initial);
  const model = new WorkflowModel({ collaborationEnabled: true, sharedModel });

  const context: any = { model, ready: Promise.resolve() };
  const widget = new ExperimentManagerWidget(context);
  // Keep JupyterLab's React root from mounting a real Composer over the stub.
  (widget as any).renderDOM = () => Promise.resolve();

  const composer = fakeComposer(initial);
  widget.composerRef = { current: composer } as any;

  await context.ready;
  await Promise.resolve();

  return { widget, model, sharedModel, composer };
}

/** Apply an addition made by another client, as an incoming Yjs update. */
function remoteAdd(sharedModel: Workflow, chart: IChart): void {
  const remote = new Workflow();
  Y.applyUpdate(remote.ydoc, Y.encodeStateAsUpdate(sharedModel.ydoc));
  remote.setChart(chart);
  Y.applyUpdate(
    sharedModel.ydoc,
    Y.encodeStateAsUpdate(remote.ydoc, Y.encodeStateVector(sharedModel.ydoc))
  );
}

describe('local flush vs. a concurrent remote addition', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps a node that arrives inside the debounce window', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1'])
    );

    // t=0  This client edits n1. One edit, no drag.
    const edited = chartWith(['n1']);
    edited.nodes['n1'].position = { x: 99, y: 99 };
    composer.state.chart = edited;
    (widget as any)._onComposerChartChange(edited);

    // t=10 A collaborator's draft node arrives and the widget repaints.
    jest.advanceTimersByTime(10);
    remoteAdd(sharedModel, chartWith(['n1', 'draft-A']));
    expect(Object.keys(composer.state.chart.nodes).sort()).toEqual([
      'draft-A',
      'n1'
    ]); // the node appeared
    // ...and the repaint did not roll back the edit in progress.
    expect(composer.state.chart.nodes['n1'].position).toEqual({ x: 99, y: 99 });

    // t=50 The debounced flush runs.
    jest.advanceTimersByTime(50);

    // ...and the collaborator's node is still there, alongside the local edit.
    const chart = sharedModel.getChart();
    expect(Object.keys(chart.nodes).sort()).toEqual(['draft-A', 'n1']);
    expect(chart.nodes['n1'].position).toEqual({ x: 99, y: 99 });

    widget.dispose();
  });

  it('keeps a node added locally but not yet flushed', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1'])
    );

    // The user creates a draft node; the flush is still 50ms away.
    const added = chartWith(['n1', 'draft-mine']);
    composer.state.chart = added;
    (widget as any)._onComposerChartChange(added);

    jest.advanceTimersByTime(10);
    remoteAdd(sharedModel, chartWith(['n1', 'draft-theirs']));

    // The new node is still on screen after the repaint.
    expect(Object.keys(composer.state.chart.nodes).sort()).toEqual([
      'draft-mine',
      'draft-theirs',
      'n1'
    ]);

    jest.advanceTimersByTime(50);
    expect(Object.keys(sharedModel.getChart().nodes).sort()).toEqual([
      'draft-mine',
      'draft-theirs',
      'n1'
    ]);

    widget.dispose();
  });

  it('applies a deletion made by a collaborator', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1', 'n2'])
    );

    remoteAdd(sharedModel, chartWith(['n1']));

    expect(Object.keys(composer.state.chart.nodes)).toEqual(['n1']);

    jest.advanceTimersByTime(50);
    expect(Object.keys(sharedModel.getChart().nodes)).toEqual(['n1']);

    widget.dispose();
  });

  it('still applies a deletion the local user actually made', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1', 'n2'])
    );

    const withoutN2 = chartWith(['n1']);
    composer.state.chart = withoutN2;
    (widget as any)._onComposerChartChange(withoutN2);
    jest.advanceTimersByTime(50);

    expect(Object.keys(sharedModel.getChart().nodes)).toEqual(['n1']);

    widget.dispose();
  });
});

// The node editor's "Replace with containerized cell" waits on the catalogue,
// and collaborators keep editing meanwhile. Applying the result to the chart
// captured before the wait writes back a pre-fetch snapshot, and the flush that
// follows reads a collaborator's addition as a local deletion.
describe('an edit that completes after an await', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not revert what arrived while it was in flight', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1'])
    );

    // The editor renders and captures the chart it was handed.
    const atRenderTime = composer.state.chart;

    // The catalogue call is in flight; a collaborator adds a node.
    remoteAdd(sharedModel, chartWith(['n1', 'draft-A']));
    expect(Object.keys(composer.state.chart.nodes).sort()).toEqual([
      'draft-A',
      'n1'
    ]);

    // The call returns and the node is replaced. The updater form applies the
    // change to what the composer holds now, not to `atRenderTime`.
    composer.setChart(prev => {
      expect(prev).not.toBe(atRenderTime);
      return {
        ...(prev as IChart),
        nodes: {
          ...(prev as IChart).nodes,
          n1: { ...(prev as IChart).nodes['n1'], type: 'workflow-cell' }
        }
      };
    });
    (widget as any)._onComposerChartChange();
    jest.advanceTimersByTime(50);

    const chart = sharedModel.getChart();
    expect(Object.keys(chart.nodes).sort()).toEqual(['draft-A', 'n1']);
    expect(chart.nodes['n1'].type).toBe('workflow-cell');

    widget.dispose();
  });
});

describe('chart-level params', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const threshold = { node_id: 'n1', name: 'threshold', value: '42' };
  const seed = { node_id: 'n2', name: 'seed', value: '7' };

  function withParams(chart: IChart, params: (typeof threshold)[]): IChart {
    return { ...chart, properties: { params } };
  }

  it('keeps a local param edit made while a collaborator added a node', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1'])
    );

    composer.state.chart = withParams(composer.state.chart, [threshold]);
    (widget as any)._onComposerChartChange();

    jest.advanceTimersByTime(10);
    remoteAdd(sharedModel, chartWith(['n1', 'draft-A']));

    // The repaint must not drop the param that has not flushed yet.
    expect(composer.state.chart.properties.params).toEqual([threshold]);

    jest.advanceTimersByTime(50);

    const chart = sharedModel.getChart();
    expect(chart.properties.params).toEqual([threshold]);
    expect(Object.keys(chart.nodes).sort()).toEqual(['draft-A', 'n1']);

    widget.dispose();
  });

  it('applies a param another client set, and keeps this client’s own', async () => {
    const { widget, sharedModel, composer } = await makeWidget(
      chartWith(['n1'])
    );

    composer.state.chart = withParams(composer.state.chart, [threshold]);
    (widget as any)._onComposerChartChange();
    jest.advanceTimersByTime(50);

    // The other client sets a different param on top of what we just wrote.
    const remote = new Workflow();
    Y.applyUpdate(remote.ydoc, Y.encodeStateAsUpdate(sharedModel.ydoc));
    remote.setChart(
      withParams(chartWith(['n1']), [threshold, seed]) as unknown as IChart
    );
    Y.applyUpdate(
      sharedModel.ydoc,
      Y.encodeStateAsUpdate(remote.ydoc, Y.encodeStateVector(sharedModel.ydoc))
    );

    expect(composer.state.chart.properties.params).toEqual([threshold, seed]);

    widget.dispose();
  });
});

describe('a legacy document loaded through the shared model', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is migrated, even though setSource was never called', async () => {
    // With collaboration on, the server reads the file into the shared document
    // and this client never calls `fromString` - so `Workflow.setSource`, where
    // the migrations used to run, is never reached.
    const legacy = {
      ...defaultChart,
      nodes: {
        s1: {
          id: 's1',
          type: 'splitter',
          position: { x: 0, y: 0 },
          ports: {},
          properties: { cell: { title: 'Splitter', params: [] } }
        }
      }
    } as unknown as IChart;

    const { widget, sharedModel } = await makeWidget(legacy);

    const chart = sharedModel.getChart() as Record<string, any>;
    expect(chart.metadata).toEqual({ version: '1.1' });
    expect(chart.nodes.s1.properties.cell.params).toContainEqual(
      expect.objectContaining({ name: 'param_max_branches' })
    );

    widget.dispose();
  });

  it('leaves a current document alone', async () => {
    const current = {
      ...chartWith(['n1']),
      metadata: { version: '1.1' }
    } as unknown as IChart;

    const { widget, sharedModel } = await makeWidget(current);

    expect(sharedModel.getChart()).toEqual(current);

    widget.dispose();
  });
});
