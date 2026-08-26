import * as React from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import {
  IConfig,
  IFlowChartCallbacks,
  ILink
} from '@mrblenny/react-flow-chart';

import { CellInfo } from '../common/CellInfo';
import { CellInfoHeader } from '../common/CellInfoHeader';
import { IChart, INode } from '../../utils/chart';

function LinkEditor({ link, onClose }: { link: ILink; onClose: () => void }) {
  return <CellInfoHeader onClose={onClose}>Link</CellInfoHeader>;
}

function NodeEditor({ node, onClose }: { node: INode; onClose: () => void }) {
  return (
    <>
      <CellInfoHeader onClose={onClose}>
        {node.properties.cell.title}
      </CellInfoHeader>
      <CellInfo cell={node.properties.cell} />
    </>
  );
}

export function ChartElementEditor({
  chart,
  setChart,
  callbacks,
  config
}: {
  chart: IChart;
  setChart: (chart: IChart) => void;
  callbacks: IFlowChartCallbacks;
  config: IConfig;
}) {
  // when no chart element is selected, chart.selected === {}
  if (!chart.selected.id) {
    return <></>;
  }

  function onClose() {
    setChart({
      ...chart,
      selected: {}
    });
  }

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 380,
        maxHeight: 'calc(100% - 40px)',
        overflowX: 'clip',
        overflowY: 'scroll'
      }}
    >
      {chart.selected.type === 'link' && (
        <LinkEditor
          link={chart.links[chart.selected.id as string]}
          onClose={onClose}
        />
      )}
      {chart.selected.type === 'node' && (
        <NodeEditor
          node={chart.nodes[chart.selected.id as string]}
          onClose={onClose}
        />
      )}
      <div style={{ margin: '15px' }}>
        <Button
          variant="contained"
          onClick={() => {
            return callbacks.onDeleteKey({ config: config });
          }}
        >
          Delete
        </Button>
      </div>
    </Paper>
  );
}
