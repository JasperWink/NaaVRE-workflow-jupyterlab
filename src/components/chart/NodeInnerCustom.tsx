import * as React from 'react';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { SxProps } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import { INodeInnerDefaultProps } from '@mrblenny/react-flow-chart';
import { SplitterParamMaxBranchesButton } from './NodeParamValue';
import { IChart, IChartParam } from '../../utils/chart';

function SpecialCellIcon({ nodeType, sx }: { nodeType: string; sx: SxProps }) {
  switch (nodeType) {
    case 'splitter':
      return <CallSplitIcon sx={{ transform: 'rotate(90deg)', ...sx }} />;
    case 'merger':
      return <CallMergeIcon sx={{ transform: 'rotate(90deg)', ...sx }} />;
    default:
      return <></>;
  }
}

export function nodeInnerCustomFactory(
  chart: IChart | null,
  setSelectedChartParam: (chartParam: IChartParam) => void
) {
  function NodeInnerCustom({ node }: INodeInnerDefaultProps) {
    return (
      <div
        style={{
          width: '190px',
          padding: '5px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <SpecialCellIcon nodeType={node.type} sx={{ fontSize: '50px' }} />
          {node.type === 'splitter' && (
            <SplitterParamMaxBranchesButton
              chart={chart}
              setSelectedChartParam={setSelectedChartParam}
              nodeId={node.id}
            />
          )}
        </Stack>
      </div>
    );
  }
  return NodeInnerCustom;
}
