import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { green, grey } from '@mui/material/colors';
import { ThemeProvider } from '@mui/material/styles';

import {
  IParam,
  ISecret
} from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { NaaVREExternalService } from '../../naavre-common/handler';
import { theme } from '../../Theme';
import { SettingsContext } from '../../settings';
import WorkflowRepeatPicker from '../WorkflowRepeatPicker';
import { runWorkflowNotification } from './runWorkflowNotification';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import { getChartParam, IChart } from '../../utils/chart';

const ignoredParams = ['param_max_branches'];

interface IBaseVariableFormValue {
  name: string;
  node_ids: Array<string>;
  value: string | null;
}

interface IParamFormValue extends IBaseVariableFormValue {
  default_value: string | null;
}

interface ISecretFormValue extends IBaseVariableFormValue {}

interface IBaseVariablePayloadValue {
  name: string;
  node_id: string;
  value: string;
}

interface IParamValuePayload extends IBaseVariablePayloadValue {}

interface ISecretValuePayload extends IBaseVariablePayloadValue {}

// Partial type for POST {workflowServiceUrl}/submit
declare type SubmitWorkflowResponse = {
  run_url: string;
};

export function RunWorkflowDialog({
  open,
  onClose,
  chart,
  container
}: {
  open: boolean;
  onClose: () => void;
  chart: IChart;
  container: HTMLDivElement | null;
}) {
  return (
    <Dialog onClose={onClose} open={open} container={container}>
      <DialogTitle>Run Workflow</DialogTitle>
      <DialogContent>
        <RunWorkflowDialogContent onClose={onClose} chart={chart} />
      </DialogContent>
    </Dialog>
  );
}

function RunWorkflowDialogContent({
  onClose,
  chart
}: {
  onClose: () => void;
  chart: IChart;
}) {
  const settings = useContext(SettingsContext);
  const [params, setParams] = useState<{ [name: string]: IParamFormValue }>({});
  const [secrets, setSecrets] = useState<{ [name: string]: ISecretFormValue }>(
    {}
  );
  const [cron, setCron] = useState<string | null>(null);
  const [hasDraftCells, setHasDraftCells] = useState<boolean>(false);
  const [submittedWorkflow, setSubmittedWorkflow] =
    useState<SubmitWorkflowResponse | null>(null);

  const setParam = (name: string, value: IParamFormValue) => {
    setParams(prevState => ({ ...prevState, [name]: value }));
  };
  const setSecret = (name: string, value: ISecretFormValue) => {
    setSecrets(prevState => ({ ...prevState, [name]: value }));
  };
  const isCron = cron !== null;

  useEffect(() => {
    let hasDraftCells = false;
    const params: { [name: string]: IParamFormValue } = {};
    const secrets: { [name: string]: ISecretFormValue } = {};
    const paramNodeIds: { [name: string]: Array<string> } = {};
    const secretNodeIds: { [name: string]: Array<string> } = {};
    Object.values(chart.nodes).forEach(node => {
      if (node.properties.cell.is_draft === true) {
        hasDraftCells = true;
      }
      node.properties.cell.params.forEach((param: IParam) => {
        const isParamInChartProperties =
          getChartParam(chart, { node_id: node.id, name: param.name }) !==
          undefined;
        const isIgnored = ignoredParams.includes(param.name);
        if (!isParamInChartProperties && !isIgnored) {
          if (!(param.name in paramNodeIds)) {
            paramNodeIds[param.name] = [];
          }
          paramNodeIds[param.name].push(node.id);
          params[param.name] = {
            name: param.name,
            node_ids: paramNodeIds[param.name],
            value: null,
            default_value: param.default_value || null
          };
        }
      });
      node.properties.cell.secrets.forEach((secret: ISecret) => {
        if (!(secret.name in secretNodeIds)) {
          secretNodeIds[secret.name] = [];
        }
        secretNodeIds[secret.name].push(node.id);
        secrets[secret.name] = {
          name: secret.name,
          node_ids: secretNodeIds[secret.name],
          value: null
        };
      });
    });
    setHasDraftCells(hasDraftCells);
    setParams(Object.fromEntries(Object.entries(params).sort()));
    setSecrets(Object.fromEntries(Object.entries(secrets).sort()));
  }, [chart.properties, chart.nodes]);

  const updateParamValue = async (
    event: ChangeEvent<{ value: string }>,
    key: string
  ) => {
    setParam(key, {
      ...params[key],
      value: event.target.value
    });
  };

  const updateSecretValue = async (
    event: ChangeEvent<{ value: string }>,
    key: string
  ) => {
    setSecret(key, {
      ...secrets[key],
      value: event.target.value
    });
  };

  const allValuesFilled = () => {
    let all_filled = true;
    Object.values(params).forEach(param => {
      all_filled = all_filled && param.value !== null;
    });
    Object.values(secrets).forEach(secret => {
      all_filled = all_filled && secret.value !== null;
    });
    return all_filled;
  };

  const getValuesFromCatalog = async () => {
    Object.entries(params).forEach(([k, v]) => {
      setParam(k, {
        ...v,
        value: v.default_value || null
      });
    });
  };

  const runWorkflow = async (
    params: {
      [name: string]: IParamFormValue;
    },
    secrets: {
      [name: string]: ISecretFormValue;
    }
  ) => {
    const paramsPayload: Array<IParamValuePayload> = [];
    const secretsPayload: Array<ISecretValuePayload> = [];
    Object.values(params).forEach(({ node_ids, name, value, ...rest }) => {
      node_ids.forEach(nodeId => {
        if (value === null) {
          throw Error(`Cannot submit workflow with null param: ${name}`);
        }
        paramsPayload.push({
          node_id: nodeId,
          name: name,
          value: value
        });
      });
    });
    Object.values(chart.properties.params).forEach(
      ({ node_id, name, value, ...rest }) => {
        if (value === undefined) {
          throw Error(
            `Cannot submit workflow with undefined node param: ${name}`
          );
        }
        paramsPayload.push({
          node_id: node_id,
          name: name,
          value: value
        });
      }
    );
    Object.values(secrets).forEach(({ node_ids, name, value, ...rest }) => {
      node_ids.forEach(nodeId => {
        if (value === null) {
          throw Error(`Cannot submit workflow with null secret: ${name}`);
        }
        secretsPayload.push({
          node_id: nodeId,
          name: name,
          value: value
        });
      });
    });
    NaaVREExternalService(
      'POST',
      `${settings.workflowServiceUrl}/submit`,
      {},
      {
        virtual_lab: settings.virtualLab,
        naavrewf2: chart,
        params: paramsPayload,
        secrets: secretsPayload,
        cron_schedule: cron
      }
    )
      .then(resp => {
        if (resp.status_code !== 200) {
          throw `${resp.status_code} ${resp.reason}`;
        }
        const data: SubmitWorkflowResponse = JSON.parse(resp.content);
        setSubmittedWorkflow(data);
        if (!isCron) {
          runWorkflowNotification(data.run_url, settings);
        }
      })
      .catch(error => {
        const msg = `Error running the workflow: ${error}`;
        console.log(msg);
        alert(msg);
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          display: 'flex',
          overflow: 'scroll',
          flexDirection: 'column'
        }}
      >
        {submittedWorkflow ? (
          <div>
            <div
              style={{
                padding: '10px',
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CheckCircleOutlineIcon
                fontSize="large"
                sx={{ color: green[500] }}
              />
              {isCron ? (
                <>
                  <p style={{ fontSize: 'large' }}>
                    Recurring workflow scheduled!
                  </p>
                  <p style={{ fontSize: 'medium' }}>
                    <a
                      style={{
                        textDecoration: 'underline',
                        color: 'var(--jp-content-link-color)'
                      }}
                      href={submittedWorkflow.run_url}
                      target="_blank"
                    >
                      Show in workflow engine
                    </a>
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 'large' }}>Workflow submitted!</p>
              )}
            </div>
            <Stack
              direction="row"
              spacing={2}
              style={{
                float: 'right',
                alignItems: 'center'
              }}
            >
              <Button
                variant="contained"
                className={'lw-panel-button'}
                onClick={onClose}
                color="primary"
                style={{
                  float: 'right'
                }}
              >
                Ok
              </Button>
            </Stack>
          </div>
        ) : (
          <div>
            {Object.keys(params).length !== 0 && (
              <div
                style={{
                  textAlign: 'right',
                  padding: '10px 15px 10px 15px'
                }}
              >
                <Button
                  disabled={false}
                  onClick={getValuesFromCatalog}
                  size="small"
                  variant="text"
                  endIcon={<AutoModeIcon fontSize="inherit" />}
                  style={{ color: grey[900], textTransform: 'none' }}
                >
                  Use default parameter values
                </Button>
              </div>
            )}
            <Stack
              direction="column"
              spacing={2}
              style={{ width: '80vw', maxWidth: '100%' }}
            >
              {Object.entries(params).map(([k, v]) => (
                <TextField
                  key={k}
                  label={k}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={params[k].value}
                  onChange={e => updateParamValue(e, k)}
                />
              ))}
              {Object.entries(secrets).map(([k, v]) => (
                <TextField
                  key={k}
                  label={k}
                  slotProps={{ inputLabel: { shrink: true } }}
                  type="password"
                  autoComplete="off"
                  value={secrets[k].value}
                  onChange={e => updateSecretValue(e, k)}
                />
              ))}
            </Stack>
            {hasDraftCells && (
              <Stack
                direction="column"
                spacing={2}
                style={{
                  marginTop: '2rem'
                }}
              >
                <Alert severity="error">
                  You cannot run this workflow because it contains draft cells.
                </Alert>
              </Stack>
            )}
            <Stack
              direction="row"
              spacing={2}
              style={{
                float: 'right',
                marginTop: '2rem',
                alignItems: 'center'
              }}
            >
              <WorkflowRepeatPicker
                setCron={setCron}
                disabled={hasDraftCells}
              />
              <Button
                variant="contained"
                className={'lw-panel-button'}
                onClick={() => runWorkflow(params, secrets)}
                color="primary"
                disabled={hasDraftCells || !allValuesFilled()}
                style={{
                  float: 'right'
                }}
              >
                Run
              </Button>
            </Stack>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
