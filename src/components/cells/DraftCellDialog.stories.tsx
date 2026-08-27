import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DraftCellDialog } from './DraftCellDialog';
import { makeDraftCell } from '../../utils/specialCells';

const meta = {
  component: DraftCellDialog
} satisfies Meta<typeof DraftCellDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    open: true,
    onClose: () => {},
    onSave: init => console.log('draft created', init),
    initialCell: null
  }
};

export const Edit: Story = {
  args: {
    open: true,
    onClose: () => {},
    onSave: init => console.log('draft updated', init),
    initialCell: makeDraftCell({
      title: 'My draft step',
      description: 'Computes something — cell not built yet',
      inputs: [{ name: 'in_data', type: 'str' }],
      outputs: [{ name: 'out_result', type: 'str' }]
    })
  }
};
