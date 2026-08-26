import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { cells as mockCells } from '../../mocks/catalogue-service/workflow-cells';
import { sharingScopes as mockSharingScopes } from '../../mocks/catalogue-service/sharing-scopes';
import { CellShareDialog } from './CellShareDialog';
import { SharingScopesContext } from './SharingScopesContext';

const meta = {
  component: CellShareDialog
} satisfies Meta<typeof CellShareDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    readonly: false,
    onClose: () => {},
    onUpdated: () => {},
    cell: mockCells[0]
  },
  decorators: [
    (Story, { parameters }) => {
      return (
        <SharingScopesContext.Provider value={mockSharingScopes}>
          <Story />
        </SharingScopesContext.Provider>
      );
    }
  ]
};
