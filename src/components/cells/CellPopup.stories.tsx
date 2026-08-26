import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { cells as mockCells } from '../../mocks/catalogue-service/workflow-cells';
import { CellPopup } from './CellPopup';

const meta = {
  component: CellPopup
} satisfies Meta<typeof CellPopup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    cell: mockCells[0],
    cellNode: null,
    onClose: () => {}
  }
};
