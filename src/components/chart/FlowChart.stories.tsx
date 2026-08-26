import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { mapValues } from 'lodash';
import {
  actions,
  FlowChart,
  INodeDefaultProps
} from '@mrblenny/react-flow-chart';

import { chart as mockChart } from '../../mocks/chart';
import { NodeCustom } from './NodeCustom';
import { nodeInnerCustomFactory } from './NodeInnerCustom';
import { PortCustom } from './PortCustom';
import { LinkCustom } from './LinkCustom';
import { IChart, IChartParam, validateLink } from '../../utils/chart';

function FlowChartStory() {
  const [chart, setChart] = useState<IChart | null>(mockChart);
  const setSelectedChartParam = (chartParam: IChartParam) => {};
  const chartStateActions = mapValues(
    actions,
    (func: any) =>
      (...args: any) => {
        const newChartTransformer = func(...args);
        const newChart = newChartTransformer(chart);
        setChart(chart => ({ ...chart, ...newChart }));
      }
  ) as typeof actions;
  return (
    <FlowChart
      chart={chart ?? mockChart}
      callbacks={chartStateActions}
      config={{
        readonly: false,
        validateLink: validateLink
      }}
      Components={{
        Node: NodeCustom as React.FunctionComponent<INodeDefaultProps>,
        NodeInner: nodeInnerCustomFactory(chart, setSelectedChartParam),
        Port: PortCustom,
        Link: LinkCustom
      }}
    />
  );
}

const meta = {
  component: FlowChartStory
} satisfies Meta<typeof FlowChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
