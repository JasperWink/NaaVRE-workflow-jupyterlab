import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
  IBaseVariable,
  ICell,
  VariableType
} from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { requestAPI } from '../../naavre-common/handler';
import {
  appendCodeCell,
  canInsertIntoNotebook,
  openNotebook
} from '../../naavre-common/notebook';

const DRAFT_CELL_METADATA = { draft_node: true };

interface INotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  id: string;
  metadata: Record<string, unknown>;
  source: string[];
  outputs: unknown[];
  execution_count: null;
}

interface INotebookContent {
  nbformat: number;
  nbformat_minor: number;
  metadata: Record<string, unknown>;
  cells: INotebookCell[];
}

interface IContentsItem {
  name: string;
  path: string;
  type: string;
}

interface IContentsResponse {
  type: string;
  content: INotebookContent | IContentsItem[];
}

// The containerizer recognises R cells by `kernel === 'irkernel'`.
type CellLanguage = 'python' | 'r';

function defaultLanguage(cell: ICell): CellLanguage {
  return cell.kernel?.toLowerCase() === 'irkernel' ? 'r' : 'python';
}

// Type names in the cell header are the containerizer's, not the catalogue's.
const HEADER_TYPES: Record<VariableType, string> = {
  int: 'Integer',
  float: 'Float',
  str: 'String',
  list: 'List'
};

// A bare name is valid: it leaves the type to fill in when containerizing.
function headerVars(vars: Array<IBaseVariable>): string[] {
  return vars.map(v =>
    v.type ? `- ${v.name}: ${HEADER_TYPES[v.type]}` : `- ${v.name}`
  );
}

// R has no `assert`; `stopifnot()` with a named expression (R >= 4.0) is the
// closest. It has no separate float type either: both are numeric.
const R_TYPES: Record<VariableType, { predicate: string; label: string }> = {
  int: { predicate: 'is.numeric', label: 'numeric' },
  float: { predicate: 'is.numeric', label: 'numeric' },
  str: { predicate: 'is.character', label: 'character' },
  list: { predicate: 'is.list', label: 'list' }
};

// The containerizer serializes whatever name the header declares, so a typo or
// wrong type only fails at workflow runtime. Inputs get no check: they come
// from upstream cells, which may not exist yet.
function outputCheck(v: IBaseVariable, language: CellLanguage): string {
  if (language === 'r') {
    const t = v.type ? R_TYPES[v.type] : null;
    return t
      ? `stopifnot("Output '${v.name}' must be ${t.label}" = ${t.predicate}(${v.name}))`
      : `# ${v.name}: type unspecified`;
  }
  const t = v.type || 'object';
  return `assert isinstance(${v.name}, ${t}), "Output '${v.name}' must be of type ${t}"`;
}

// The YAML header declares the interface, overriding the code analysis that
// would otherwise need a producer and a consumer cell for every variable.
// https://naavre.net/docs/NaaVRE_documentation/component-containerizer/
function generateCellSource(cell: ICell, language: CellLanguage): string {
  const lines: string[] = [];

  lines.push(`# ${cell.title}`);
  lines.push('# Description:');
  if (cell.description) {
    for (const descLine of cell.description.split('\n')) {
      lines.push(`# ${descLine}`);
    }
  }

  // Indentation is relative to the '# ' prefix, which is stripped per line.
  const doc: string[] = ['NaaVRE:', '  cell:'];
  for (const [key, vars] of [
    ['inputs', cell.inputs],
    ['outputs', cell.outputs]
  ] as const) {
    if (vars.length === 0) {
      doc.push(`    ${key}: []`);
    } else {
      doc.push(`    ${key}:`);
      doc.push(...headerVars(vars).map(line => `      ${line}`));
    }
  }
  lines.push('# ---');
  lines.push(...doc.map(line => `# ${line}`));
  lines.push('# ...');

  lines.push('');
  lines.push('# Cell implementation:');
  lines.push('# TODO');

  if (cell.outputs.length > 0) {
    lines.push('');
    lines.push('# Output:');
    for (const v of cell.outputs) {
      lines.push(outputCheck(v, language));
    }
  }

  return lines.join('\n');
}

// nbformat requires cell ids to be unique within a notebook, and nothing here
// checks the target's existing ids — a timestamp alone collides for two cells
// added in the same millisecond.
function makeCellId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `draft-${Date.now().toString(36)}-${rand}`;
}

function makeNotebookCell(source: string): INotebookCell {
  return {
    cell_type: 'code',
    id: makeCellId(),
    metadata: { ...DRAFT_CELL_METADATA },
    source: source
      .split('\n')
      .map((l, i, arr) => (i < arr.length - 1 ? l + '\n' : l)),
    outputs: [],
    execution_count: null
  };
}

const KERNELSPECS: Record<
  CellLanguage,
  { kernelspec: Record<string, string>; language_info: Record<string, string> }
> = {
  python: {
    kernelspec: {
      display_name: 'Python 3',
      language: 'python',
      name: 'python3'
    },
    language_info: { name: 'python', version: '3.9.0' }
  },
  r: {
    kernelspec: { display_name: 'R', language: 'R', name: 'ir' },
    language_info: { name: 'R' }
  }
};

function emptyNotebook(language: CellLanguage): INotebookContent {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: { ...KERNELSPECS[language] },
    cells: []
  };
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function writeNotebook(
  path: string,
  notebook: INotebookContent
): Promise<void> {
  await requestAPI(`api/contents/${encodePath(path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      type: 'notebook',
      format: 'json',
      content: notebook
    })
  });
}

// Whether a file already exists at `path`. `content=0` asks for metadata only,
// so this does not download the whole notebook.
async function pathExists(path: string): Promise<boolean> {
  try {
    await requestAPI(`api/contents/${encodePath(path)}?content=0`);
    return true;
  } catch {
    return false;
  }
}

// Fallback when the document manager is unavailable: rewrite the notebook file
// via the Contents API. Changes only show once it is (re)opened.
async function appendCellViaContentsApi(
  path: string,
  cellSource: string
): Promise<void> {
  const resp = await requestAPI<IContentsResponse>(
    `api/contents/${encodePath(path)}`
  );
  if (resp.type !== 'notebook') {
    throw new Error(`"${path}" is not a notebook.`);
  }
  const notebook = resp.content as INotebookContent;
  notebook.cells.push(makeNotebookCell(cellSource));
  await writeNotebook(path, notebook);
}

interface ISnackbarState {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
}

export function AddToNotebookDialog({
  open,
  onClose,
  cell
}: {
  open: boolean;
  onClose: () => void;
  cell: ICell;
}) {
  const [notebooks, setNotebooks] = useState<IContentsItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');

  const [newName, setNewName] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [snackbar, setSnackbar] = useState<ISnackbarState>({
    open: false,
    severity: 'success',
    message: ''
  });

  const [language, setLanguage] = useState<CellLanguage>(defaultLanguage(cell));

  const cellSource = generateCellSource(cell, language);

  const fetchNotebooks = async () => {
    setLoadingList(true);
    try {
      const resp = await requestAPI<IContentsResponse>('api/contents/');
      const items = resp.content as IContentsItem[];
      const nbs = items.filter(f => f.type === 'notebook');
      setNotebooks(nbs);
      // Keep selected path only if it still exists
      if (selectedPath && !nbs.find(nb => nb.path === selectedPath)) {
        setSelectedPath('');
      }
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: `Could not list notebooks: ${e instanceof Error ? e.message : String(e)}`
      });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedPath('');
      setNewName('');
      setLanguage(defaultLanguage(cell));
      fetchNotebooks();
    }
  }, [open]);

  const showResult = (severity: 'success' | 'error', message: string) => {
    setSnackbar({ open: true, severity, message });
  };

  const handleAdd = async () => {
    if (!selectedPath) {
      return;
    }
    setLoadingAdd(true);
    onClose(); // close dialog immediately
    try {
      if (canInsertIntoNotebook()) {
        // Insert into the live notebook so the cell appears immediately,
        // whether or not the notebook is already open.
        await appendCodeCell(selectedPath, cellSource, DRAFT_CELL_METADATA);
        showResult('success', `Cell added to ${selectedPath}.`);
      } else {
        await appendCellViaContentsApi(selectedPath, cellSource);
        showResult(
          'success',
          `Cell added to ${selectedPath}. Reopen the notebook to see it.`
        );
      }
    } catch (e: unknown) {
      showResult(
        'error',
        `Failed to add cell: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim().replace(/\.ipynb$/, '');
    if (!name) {
      return;
    }
    const path = `${name}.ipynb`;
    setLoadingCreate(true);
    onClose(); // close dialog immediately
    try {
      // Guard against silently overwriting an existing notebook.
      if (await pathExists(path)) {
        throw new Error(
          `"${path}" already exists. Pick another name, or add to it above.`
        );
      }
      // A brand-new notebook has no open widget, so writing the cell straight to
      // the file is safe; then reveal it so the user sees the result.
      await writeNotebook(path, {
        ...emptyNotebook(language),
        cells: [makeNotebookCell(cellSource)]
      });
      if (canInsertIntoNotebook()) {
        openNotebook(path);
      }
      showResult('success', `Created ${path} with the cell.`);
      setNewName('');
      // Refresh the list so the new notebook appears in the dropdown.
      fetchNotebooks();
    } catch (e: unknown) {
      showResult(
        'error',
        `Failed to create notebook: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  const loading = loadingAdd || loadingCreate;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          Add to notebook
          <ToggleButtonGroup
            size="small"
            exclusive
            value={language}
            onChange={(_, v: CellLanguage | null) => v && setLanguage(v)}
            aria-label="Cell language"
          >
            <ToggleButton value="python">Python</ToggleButton>
            <ToggleButton value="r">R</ToggleButton>
          </ToggleButtonGroup>
        </DialogTitle>
        <DialogContent>
          {/* ── Existing notebooks ── */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Add to existing notebook
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl fullWidth size="small">
              <InputLabel>Notebook</InputLabel>
              <Select
                label="Notebook"
                value={selectedPath}
                onChange={e => setSelectedPath(e.target.value)}
                disabled={loadingList || loading}
              >
                {notebooks.length === 0 && (
                  <MenuItem disabled value="">
                    {loadingList ? 'Loading…' : 'No notebooks found'}
                  </MenuItem>
                )}
                {notebooks.map(nb => (
                  <MenuItem key={nb.path} value={nb.path}>
                    {nb.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              onClick={fetchNotebooks}
              disabled={loadingList || loading}
              aria-label="Refresh notebook list"
            >
              {loadingList ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Stack>

          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!selectedPath || loading}
            startIcon={loadingAdd ? <CircularProgress size={16} /> : undefined}
            sx={{ mt: 1 }}
            fullWidth
          >
            Add to notebook
          </Button>

          <Divider sx={{ my: 2 }}>or create new</Divider>

          {/* ── New notebook ── */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            New notebook
          </Typography>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField
              size="small"
              fullWidth
              label="Notebook name"
              placeholder="e.g. my-analysis"
              helperText="The .ipynb extension will be added automatically."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              disabled={loading}
            />
            <Button
              variant="outlined"
              onClick={handleCreate}
              disabled={!newName.trim() || loading}
              startIcon={
                loadingCreate ? <CircularProgress size={16} /> : undefined
              }
              sx={{ mt: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Create & add
            </Button>
          </Stack>

          {/* ── Cell preview ── */}
          <Typography
            variant="subtitle2"
            sx={{ mt: 2, mb: 0.5, color: 'text.secondary' }}
          >
            Cell that will be added:
          </Typography>
          <pre
            style={{
              margin: 0,
              padding: '10px 12px',
              background: '#f5f5f5',
              borderRadius: 4,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace'
            }}
          >
            {cellSource}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar sits outside the Dialog so it persists after the dialog closes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
