import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import {
  IConfig,
  IFlowChartCallbacks,
  ILink
} from '@mrblenny/react-flow-chart';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { DRAFT_CELL_TYPE, makeDraftCell } from '../../utils/specialCells';
import { IChart, INode, updateChartNodeCell } from '../../utils/chart';
import { fetchListFromCatalogue } from '../../utils/catalog';
import {
  describeIODiff,
  findContainerizedCell
} from '../../utils/draftPromotion';
import { addTaskToBoard, taskBoardAvailable } from '../../boardAccess';
import { SettingsContext } from '../../settings';
import { CellInfo } from '../common/CellInfo';
import { CellInfoHeader } from '../common/CellInfoHeader';
import { AddToNotebookDialog } from '../cells/AddToNotebookDialog';
import { DraftCellDialog } from '../cells/DraftCellDialog';

function LinkEditor({ link, onClose }: { link: ILink; onClose: () => void }) {
  return <CellInfoHeader onClose={onClose}>Link</CellInfoHeader>;
}

function NodeEditor({
  node,
  chart,
  setChart,
  onClose
}: {
  node: INode;
  chart: IChart;
  setChart: (chart: IChart) => void;
  onClose: () => void;
}) {
  const settings = React.useContext(SettingsContext);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addToNotebookOpen, setAddToNotebookOpen] = React.useState(false);
  const [replacing, setReplacing] = React.useState(false);
  const [addingToBoard, setAddingToBoard] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    severity: 'success' | 'error';
    message: string;
  }>({ open: false, severity: 'success', message: '' });
  const cell = node.properties.cell as ICell;
  const isDraft = node.type === DRAFT_CELL_TYPE;

  // Copies the title/description onto a board card; the two stay unlinked.
  const addDraftToTaskBoard = async () => {
    setAddingToBoard(true);
    try {
      await addTaskToBoard({
        title: cell.title,
        description: cell.description ?? ''
      });
      setSnackbar({
        open: true,
        severity: 'success',
        message: `"${cell.title}" added to the task board.`
      });
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: `Could not add the card to the task board: ${e instanceof Error ? e.message : String(e)}`
      });
    } finally {
      setAddingToBoard(false);
    }
  };

  // Swap the draft for its catalogue cell, only if the I/O agrees so the
  // node keeps its links.
  const replaceWithContainerizedCell = async () => {
    setReplacing(true);
    try {
      if (!settings.catalogueServiceUrl) {
        throw new Error('The catalogue service URL is not configured.');
      }
      const list = await fetchListFromCatalogue<ICell>(
        `${settings.catalogueServiceUrl}/workflow-cells/?ordering=-created`,
        true
      );
      const match = findContainerizedCell(list.results, cell);
      if (match.status === 'no-title-match') {
        setSnackbar({
          open: true,
          severity: 'error',
          message: `No containerized cell titled "${cell.title}" found in the catalogue. Containerize the notebook cell first, then try again.`
        });
      } else if (match.status === 'io-mismatch') {
        setSnackbar({
          open: true,
          severity: 'error',
          message: `The containerized cell "${match.cell.title}" does not match this draft: ${describeIODiff(match.diff).join('; ')}. Update the draft or the cell so they agree.`
        });
      } else {
        setChart(updateChartNodeCell(chart, node.id, match.cell));
        setSnackbar({
          open: true,
          severity: 'success',
          message: `Draft replaced with containerized cell "${match.cell.title}".`
        });
      }
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: `Could not search the catalogue: ${e instanceof Error ? e.message : String(e)}`
      });
    } finally {
      setReplacing(false);
    }
  };

  return (
    <>
      <CellInfoHeader onClose={onClose}>{cell.title}</CellInfoHeader>
      <CellInfo cell={cell} />
      {isDraft && (
        <div
          style={{
            margin: '15px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <Button variant="outlined" onClick={() => setEditOpen(true)}>
            Edit draft
          </Button>
          <Button variant="outlined" onClick={() => setAddToNotebookOpen(true)}>
            Add to notebook
          </Button>
          {taskBoardAvailable() && (
            <Button
              variant="outlined"
              disabled={addingToBoard}
              onClick={() => void addDraftToTaskBoard()}
            >
              {addingToBoard ? 'Adding…' : 'Add to task board'}
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={replacing}
            onClick={() => void replaceWithContainerizedCell()}
          >
            {replacing
              ? 'Searching catalogue…'
              : 'Replace with containerized cell'}
          </Button>
          <DraftCellDialog
            open={editOpen}
            initialCell={cell}
            onClose={() => setEditOpen(false)}
            onSave={init => {
              setChart(
                updateChartNodeCell(
                  chart,
                  node.id,
                  makeDraftCell({ ...init, url: cell.url })
                )
              );
              setEditOpen(false);
            }}
          />
          <AddToNotebookDialog
            open={addToNotebookOpen}
            onClose={() => setAddToNotebookOpen(false)}
            cell={cell}
          />
        </div>
      )}
      {/* Outside the isDraft block: after a successful replace the node is no
          longer a draft, but the confirmation still needs to show. */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 4000 : 10000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
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
          chart={chart}
          setChart={setChart}
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
