// Every variable this dialog produces carries one of the catalogue's four
// types. The catalogue also accepts an untyped variable, but the dialog does
// not offer that state: it is not worth a blank entry in the type picker.

import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { DraftCellDialog } from './DraftCellDialog';
import { makeDraftCell } from '../../utils/specialCells';

function renderDialog(initialCell: ReturnType<typeof makeDraftCell> | null) {
  const onSave = jest.fn();
  render(
    <DraftCellDialog
      open={true}
      onClose={() => undefined}
      onSave={onSave}
      initialCell={initialCell}
    />
  );
  return onSave;
}

function save() {
  fireEvent.click(screen.getByRole('button', { name: /^(Save|Create)$/ }));
}

describe('DraftCellDialog variable types', () => {
  it('keeps the types of an existing draft through an edit', () => {
    const onSave = renderDialog(
      makeDraftCell({
        title: 'Step A',
        inputs: [{ name: 'in1', type: 'list' }],
        outputs: [{ name: 'out1', type: 'int' }]
      })
    );

    save();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      inputs: [{ name: 'in1', type: 'list' }],
      outputs: [{ name: 'out1', type: 'int' }]
    });
  });

  it('gives an untyped variable the default type', () => {
    const onSave = renderDialog(
      makeDraftCell({ title: 'Step A', inputs: [{ name: 'in1', type: null }] })
    );

    save();

    expect(onSave.mock.calls[0][0].inputs).toEqual([
      { name: 'in1', type: 'str' }
    ]);
  });

  it('defaults a newly added variable to a concrete type', () => {
    const onSave = renderDialog(null);

    fireEvent.change(screen.getByRole('textbox', { name: /Name/ }), {
      target: { value: 'Step A' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'name' }), {
      target: { value: 'in1' }
    });
    save();

    expect(onSave.mock.calls[0][0].inputs).toEqual([
      { name: 'in1', type: 'str' }
    ]);
  });

  it('offers exactly the types the catalogue accepts', () => {
    renderDialog(
      makeDraftCell({ title: 'Step A', inputs: [{ name: 'in1', type: 'str' }] })
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));
    const options = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map(o => o.textContent);

    expect(options).toEqual(['str', 'int', 'float', 'list']);
  });
});
