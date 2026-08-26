import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { chart as mockChart } from '../../mocks/chart';
import { RunWorkflowDialog } from './RunWorkflowDialog';
import React from 'react';
import '@jupyterlab/apputils/style/dialog.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

const meta = {
  component: RunWorkflowDialog
} satisfies Meta<typeof RunWorkflowDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    chart: mockChart,
    open: true,
    onClose: () => {},
    container: null
  },
  decorators: [
    (Story, { parameters }) => {
      return <Story />;
    }
  ]
};
