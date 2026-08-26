import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  getChartParam,
  IChart,
  IChartParam,
  setChartParam
} from '../../utils/chart';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Edit from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { VariableInput } from '../common/VariableInput';

export function NodeParamValueDialog({
  chart,
  setChart,
  chartParam,
  setSelectedChartParam
}: {
  chart: IChart;
  setChart: (
    nextChart: IChart | ((prev: IChart | null) => IChart | null)
  ) => void;
  chartParam: IChartParam | null;
  setSelectedChartParam: (chartParam: IChartParam | null) => void;
}) {
  const [formValue, setFormValue] = useState('');

  useEffect(() => {
    if (chartParam !== null) {
      setFormValue(getChartParam(chart, chartParam) ?? '');
    }
  }, [chartParam?.node_id, chartParam?.name]);

  const handleClose = () => {
    setSelectedChartParam(null);
  };

  const handleSave = useCallback(
    (formValue: string) => {
      if (chartParam !== null) {
        setChart((chart: IChart | null) => {
          if (chart === null) {
            return chart;
          }
          return setChartParam(chart as IChart, {
            ...chartParam,
            value: formValue
          });
        });
        setSelectedChartParam(null);
      }
    },
    [chartParam, setChart, setSelectedChartParam]
  );

  return (
    <>
      <Dialog
        aria-labelledby="node-param-value-title"
        aria-describedby="node-param-value-description"
        open={chartParam !== null}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="node-param-value-title">
          {chartParam?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText
              id="node-param-value-description"
              variant="body1"
            >
              {chartParam?.helpText ?? ''}
            </DialogContentText>
            <VariableInput
              label="Value"
              type={chartParam?.type ?? 'str'}
              value={formValue}
              setValue={setFormValue}
              autoFocus
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleSave(formValue);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function NodeParamButton({
  chart,
  chartParam,
  setSelectedChartParam
}: {
  chart: IChart | null;
  chartParam: IChartParam;
  setSelectedChartParam: (chartParam: IChartParam) => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      onClick={e => {
        e.stopPropagation();
      }}
      onMouseUp={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <Tooltip title={chartParam.helpText ?? ''}>
        <Typography
          variant="caption"
          sx={{ textDecoration: 'underline', textDecorationStyle: 'dashed' }}
        >
          {getChartParam(chart, chartParam) ?? chartParam.noValueText ?? ''}
        </Typography>
      </Tooltip>
      <IconButton
        onClick={() => setSelectedChartParam(chartParam)}
        style={{
          borderRadius: '100%'
        }}
      >
        <Edit fontSize="small" />
      </IconButton>
    </Stack>
  );
}

export function SplitterParamMaxBranchesButton({
  chart,
  nodeId,
  setSelectedChartParam
}: {
  chart: IChart | null;
  nodeId: string;
  setSelectedChartParam: (chartParam: IChartParam) => void;
}) {
  const helpText =
    'Limits the number of branches created by the splitter. When unset, uses as many as possible.';

  return (
    <NodeParamButton
      chart={chart}
      setSelectedChartParam={setSelectedChartParam}
      chartParam={{
        node_id: nodeId,
        name: 'param_max_branches',
        type: 'int',
        helpText: helpText,
        noValueText: 'max'
      }}
    />
  );
}
