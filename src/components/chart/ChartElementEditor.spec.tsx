// The node editor's dialogs are local React state, so the composer can only
// learn about them through `onEditingChange`. That report is what puts the
// "editing" flag on the awareness channel (utils/presence.ts).

import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { IConfig, IFlowChartCallbacks } from '@mrblenny/react-flow-chart';

import { ChartElementEditor } from './ChartElementEditor';
import { addCellNodeToChart, defaultChart, IChart } from '../../utils/chart';
import { makeDraftCell } from '../../utils/specialCells';

const callbacks = {
  onDeleteKey: () => undefined
} as unknown as IFlowChartCallbacks;
const config = { readonly: false } as IConfig;

/** A chart holding one node, selected, as the editor is only shown for one. */
function chartWithSelectedDraft(): IChart {
  return addCellNodeToChart(
    defaultChart,
    makeDraftCell({
      title: 'Step A',
      inputs: [{ name: 'in1', type: 'str' }],
      outputs: [{ name: 'out1', type: 'str' }]
    })
  );
}

function renderEditor(chart: IChart) {
  const onEditingChange = jest.fn();
  const view = render(
    <ChartElementEditor
      chart={chart}
      setChart={() => undefined}
      callbacks={callbacks}
      config={config}
      onEditingChange={onEditingChange}
    />
  );
  return { onEditingChange, view };
}

/** The most recent value reported, which is what the composer holds. */
function lastReported(mock: jest.Mock): boolean | undefined {
  return mock.mock.calls.at(-1)?.[0];
}

describe('ChartElementEditor reports editing to the composer', () => {
  it('is not editing when the node is merely selected', () => {
    const { onEditingChange } = renderEditor(chartWithSelectedDraft());

    expect(screen.getByText('Step A')).toBeDefined();
    expect(lastReported(onEditingChange)).toBe(false);
  });

  it('is editing while the draft dialog is open', () => {
    const { onEditingChange } = renderEditor(chartWithSelectedDraft());

    fireEvent.click(screen.getByRole('button', { name: 'Edit draft' }));
    expect(lastReported(onEditingChange)).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(lastReported(onEditingChange)).toBe(false);
  });

  it('is editing while the add-to-notebook dialog is open', () => {
    const { onEditingChange } = renderEditor(chartWithSelectedDraft());

    fireEvent.click(screen.getByRole('button', { name: 'Add to notebook' }));
    expect(lastReported(onEditingChange)).toBe(true);
  });

  it('clears the flag when the editor closes with a dialog still open', () => {
    const { onEditingChange, view } = renderEditor(chartWithSelectedDraft());

    fireEvent.click(screen.getByRole('button', { name: 'Edit draft' }));
    expect(lastReported(onEditingChange)).toBe(true);

    // A collaborator deleting the node unmounts the editor mid-edit; the flag
    // has to come down, or this client stays marked as editing forever.
    view.unmount();
    expect(lastReported(onEditingChange)).toBe(false);
  });

  it('offers no draft actions on a containerized node', () => {
    const chart = addCellNodeToChart(defaultChart, {
      ...makeDraftCell({ title: 'Built' }),
      type: 'workflow-cell',
      is_draft: false,
      container_image: 'example/built:1'
    });
    const { onEditingChange } = renderEditor(chart);

    expect(screen.queryByRole('button', { name: 'Edit draft' })).toBeNull();
    expect(lastReported(onEditingChange)).toBe(false);
  });
});
