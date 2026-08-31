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
import {
  addCellNodeToChart,
  IChart,
  IChartParam,
  validateLink
} from '../utils/chart';
import { ISpecialCell } from '../utils/specialCells';
import { INodePresence, IWorkflowSelection } from '../utils/presence';
import { theme } from '../Theme';
import { SettingsContext } from '../settings';
import { NodeCustom } from './chart/NodeCustom';
import { NodePresenceContext } from './chart/NodePresenceContext';
import { nodeInnerCustomFactory } from './chart/NodeInnerCustom';
import { PortCustom } from './chart/PortCustom';
import { LinkCustom } from './chart/LinkCustom';
import { ChartElementEditor } from './chart/ChartElementEditor';
import { RunWorkflowDialog } from './workflowRunDialog/RunWorkflowDialog';
import { CellsSideBar } from './cells/CellsSideBar';
import { CellPopup } from './cells/CellPopup';
import { NodeParamValueDialog } from './chart/NodeParamValue';

export interface IProps {
  /**
   * Called whenever the chart changes locally (drag, link, drop, draft edit,
   * delete). The host widget pushes these into the shared document model.
   */
  onChartChange?: (chart: IChart) => void;

  /**
   * Called when the node this user has open changes. The host widget puts it
   * on the awareness channel so other clients can show where this user is.
   * Not debounced: a presence indicator that lags is worse than none.
   */
  onSelectionChange?: (selection: IWorkflowSelection) => void;
}

export interface IState {
  chart: IChart | null;
  selectedCellInList: ICell | null;
  selectedCellNode: HTMLDivElement | null;
  selectedChartParam: IChartParam | null;
  runWorkflowDialogOpen: boolean;
  /** Remote collaborators by node id, pushed in by the host widget. */
  nodePresence: INodePresence;
}

export const DefaultState: IState = {
  chart: null,
  selectedCellInList: null,
  selectedCellNode: null,
  selectedChartParam: null,
  runWorkflowDialogOpen: false,
  nodePresence: {}
};

export class Composer extends React.Component<IProps, IState> {
  state = DefaultState;
  containerRef: React.RefObject<HTMLDivElement>;
  static contextType = SettingsContext;
  declare context: React.ContextType<typeof SettingsContext>;

  /** Node currently being dragged, or null. See `_currentSelection`. */
  private _draggingNodeId: string | null = null;

  /** Last selection handed to `onSelectionChange`, to avoid repeat reports. */
  private _advertisedSelection: IWorkflowSelection = {
    nodeId: null,
    editing: false
  };

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
            break;
          }
          case 'onDragNode': {
            this._draggingNodeId = args[0]?.id ?? null;
            break;
          }
          case 'onDragNodeStop': {
            this._draggingNodeId = null;
            break;
          }
        }
        this.setState(
          { chart: { ...this.state.chart, ...newChart } },
          this._notifyChartChange
        );
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
    this.setState(
      prevState => ({
        chart:
          typeof nextChart === 'function'
            ? nextChart(prevState.chart)
            : nextChart
      }),
      this._notifyChartChange
    );
  };

  /** Report the committed chart to the host widget, if it asked to hear. */
  private _notifyChartChange = () => {
    if (this.state.chart) {
      this.props.onChartChange?.(this.state.chart);
    }
  };

  // Add a cell to the chart as a new node. Used by the sidebar's draft-node
  // dialog, which creates a cell rather than dragging an existing one in.
  addCellNode = (cell: ICell | ISpecialCell) => {
    this.setChart(prev => (prev ? addCellNodeToChart(prev, cell) : prev));
  };

  setSelectedChartParam = (selectedChartParam: IChartParam | null) => {
    this.setState({
      selectedChartParam: selectedChartParam
    });
  };

  setRunWorkflowDialogOpen = (open: boolean) => {
    this.setState({ runWorkflowDialogOpen: open });
  };

  /** Replace the remote collaborators shown on the canvas. */
  setNodePresence = (nodePresence: INodePresence) => {
    this.setState({ nodePresence: nodePresence });
  };

  /**
   * The node this user currently has open, for other clients to see.
   *
   * A drag in progress and an open parameter dialog both count as editing and
   * win over the plain selection: they are the cases where a concurrent edit
   * actually costs the other user work.
   */
  private _currentSelection = (): IWorkflowSelection => {
    // A drag is an edit in progress, but react-flow-chart does not select the
    // node being dragged, so it is tracked separately in chartStateActions.
    if (this._draggingNodeId !== null) {
      return { nodeId: this._draggingNodeId, editing: true };
    }
    const paramNodeId = this.state.selectedChartParam?.node_id ?? null;
    if (paramNodeId !== null) {
      return { nodeId: paramNodeId, editing: true };
    }
    const selected = this.state.chart?.selected;
    const nodeId =
      selected?.type === 'node' && selected.id ? selected.id : null;
    return { nodeId: nodeId, editing: false };
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

    // Selection is reachable from many actions (node click, canvas click,
    // delete, a node removed by another client), so it is reported from here
    // rather than from each of them.
    const selection = this._currentSelection();
    if (
      selection.nodeId !== this._advertisedSelection.nodeId ||
      selection.editing !== this._advertisedSelection.editing
    ) {
      this._advertisedSelection = selection;
      this.props.onSelectionChange?.(selection);
    }
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
              <NodePresenceContext.Provider value={this.state.nodePresence}>
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
              </NodePresenceContext.Provider>
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
                onCreateDraftCell={this.addCellNode}
              />
            </div>
          </div>
        </ThemeProvider>
      );
    }
  }
}
