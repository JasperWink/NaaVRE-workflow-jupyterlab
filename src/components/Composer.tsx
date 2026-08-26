import * as React from 'react';
import { createRef } from 'react';
import { mapValues } from 'lodash';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import * as actions from '@mrblenny/react-flow-chart/src/container/actions';
import {
  FlowChart,
  IConfig,
  INodeDefaultProps
} from '@mrblenny/react-flow-chart';

import { ICell } from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { NaaVREExternalService } from '../naavre-common/handler';
import { IChart, IChartParam, validateLink } from '../utils/chart';
import { theme } from '../Theme';
import { SettingsContext } from '../settings';
import { NodeCustom } from './chart/NodeCustom';
import { nodeInnerCustomFactory } from './chart/NodeInnerCustom';
import { PortCustom } from './chart/PortCustom';
import { LinkCustom } from './chart/LinkCustom';
import { ChartElementEditor } from './chart/ChartElementEditor';
import { RunWorkflowDialog } from './workflowRunDialog/RunWorkflowDialog';
import { CellsSideBar } from './cells/CellsSideBar';
import { CellPopup } from './cells/CellPopup';
import { NodeParamValueDialog } from './chart/NodeParamValue';

export interface IProps {}

export interface IState {
  chart: IChart | null;
  selectedCellInList: ICell | null;
  selectedCellNode: HTMLDivElement | null;
  selectedChartParam: IChartParam | null;
  runWorkflowDialogOpen: boolean;
}

export const DefaultState: IState = {
  chart: null,
  selectedCellInList: null,
  selectedCellNode: null,
  selectedChartParam: null,
  runWorkflowDialogOpen: false
};

export class Composer extends React.Component<IProps, IState> {
  state = DefaultState;
  containerRef: React.RefObject<HTMLDivElement>;
  static contextType = SettingsContext;
  declare context: React.ContextType<typeof SettingsContext>;

  constructor(props: IProps) {
    super(props);
    this.containerRef = createRef();
  }

  chartStateActions = mapValues(
    actions,
    (func: any, actionKey) =>
      (...args: any) => {
        const newChartTransformer = func(...args);
        const newChart: IChart = newChartTransformer(this.state.chart);
        switch (actionKey) {
          case 'onDeleteKey': {
            // Remove params that reference removed nodes
            newChart.properties.params = newChart.properties.params.filter(
              param => param.node_id in newChart.nodes
            );
          }
        }
        this.setState({
          chart: { ...this.state.chart, ...newChart }
        });
      }
  ) as typeof actions;

  chartConfig: IConfig = {
    // This is needed because onDeleteKey assumes config.readonly is defined...
    // https://github.com/MrBlenny/react-flow-chart/blob/0.0.14/src/container/actions.ts#L182
    readonly: false,
    validateLink: validateLink
  };

  setSelectedCell = (cell: ICell | null, cellNode: HTMLDivElement | null) => {
    this.setState({
      selectedCellInList: cell,
      selectedCellNode: cellNode
    });
  };

  setChart = (nextChart: IChart | ((prev: IChart | null) => IChart | null)) => {
    if (typeof nextChart === 'function') {
      this.setState(prevState => ({ chart: nextChart(prevState.chart) }));
    } else {
      this.setState({ chart: nextChart });
    }
  };

  setSelectedChartParam = (selectedChartParam: IChartParam | null) => {
    this.setState({
      selectedChartParam: selectedChartParam
    });
  };

  setRunWorkflowDialogOpen = (open: boolean) => {
    this.setState({ runWorkflowDialogOpen: open });
  };

  exportWorkflow = async (browserFactory: IFileBrowserFactory) => {
    if (this.state.chart === null) {
      console.error('Export failed: workflow is null');
      return;
    }
    NaaVREExternalService(
      'POST',
      `${this.context.workflowServiceUrl}/convert`,
      {},
      {
        virtual_lab: this.context.virtualLab,
        naavrewf2: this.state.chart
      }
    )
      .then(resp => {
        browserFactory.tracker.currentWidget?.model.upload(
          new File([resp.content], 'workflow.yaml')
        );
      })
      .catch(error => {
        const msg = `Error exporting the workflow: ${String(error)}`;
        console.log(msg);
        alert(msg);
      });
  };

  componentDidUpdate() {
    // TODO: Implement chart sanity checks
  }

  render(): React.ReactElement {
    if (this.state.chart === null) {
      return (
        <ThemeProvider theme={theme}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            <CircularProgress />
          </Box>
        </ThemeProvider>
      );
    } else {
      return (
        <ThemeProvider theme={theme}>
          <div
            ref={this.containerRef}
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              maxWidth: '100vw',
              maxHeight: '100vh'
            }}
          >
            <RunWorkflowDialog
              open={this.state.runWorkflowDialogOpen}
              onClose={() => this.setRunWorkflowDialogOpen(false)}
              chart={this.state.chart}
              container={this.containerRef.current}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                overflow: 'hidden'
              }}
            >
              <FlowChart
                chart={this.state.chart}
                callbacks={this.chartStateActions}
                config={this.chartConfig}
                Components={{
                  Node: NodeCustom as React.FunctionComponent<INodeDefaultProps>,
                  NodeInner: nodeInnerCustomFactory(
                    this.state.chart,
                    this.setSelectedChartParam
                  ),
                  Port: PortCustom,
                  Link: LinkCustom
                }}
              />
              {this.state.chart.selected.id && (
                <ChartElementEditor
                  chart={this.state.chart}
                  setChart={this.setChart}
                  callbacks={this.chartStateActions}
                  config={this.chartConfig}
                />
              )}
              <NodeParamValueDialog
                chart={this.state.chart}
                setChart={this.setChart}
                chartParam={this.state.selectedChartParam}
                setSelectedChartParam={this.setSelectedChartParam}
              />
              {this.state.selectedCellInList && (
                <CellPopup
                  cell={this.state.selectedCellInList}
                  cellNode={this.state.selectedCellNode}
                  onClose={() => this.setSelectedCell(null, null)}
                />
              )}
              <CellsSideBar
                selectedCellInList={this.state.selectedCellInList}
                setSelectedCell={this.setSelectedCell}
              />
            </div>
          </div>
        </ThemeProvider>
      );
    }
  }
}
