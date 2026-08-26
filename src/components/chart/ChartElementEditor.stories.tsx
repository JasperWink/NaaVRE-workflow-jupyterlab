import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { mapValues } from 'lodash';
import * as actions from '@mrblenny/react-flow-chart/src/container/actions';

import { chart as mockChart } from '../../mocks/chart';
import { ChartElementEditor } from './ChartElementEditor';

const meta = {
  component: ChartElementEditor
} satisfies Meta<typeof ChartElementEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    chart: mockChart,
    setChart: c => {},
    callbacks: mapValues(
      actions,
      (func: any) =>
        (...args: any) => {}
    ) as typeof actions,
    config: {
      readonly: false
    }
  }
};
