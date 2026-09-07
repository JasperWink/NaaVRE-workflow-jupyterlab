import { IDocumentManager } from '@jupyterlab/docmanager';
import { NotebookPanel } from '@jupyterlab/notebook';

// The document manager, registered once from index.ts. Writing to a notebook's
// live shared model makes added cells appear without a reopen.
let _docManager: IDocumentManager | null = null;

export function setDocumentManager(docManager: IDocumentManager | null): void {
  _docManager = docManager;
}

// Whether live insertion is available; if not, fall back to the Contents API.
export function canInsertIntoNotebook(): boolean {
  return _docManager !== null;
}

// Open a notebook in the background (without stealing focus from the composer),
// reusing an existing view if the notebook is already open.
export function openNotebook(path: string): void {
  if (!_docManager) {
    return;
  }
  const existing = _docManager.findWidget(path);
  if (!existing) {
    _docManager.open(path, undefined, undefined, { activate: false });
  }
}

// Append a code cell to the live shared model at `path`, then save, so it shows
// up without a reopen. Opens the notebook in the background if needed.
export async function appendCodeCell(
  path: string,
  source: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!_docManager) {
    throw new Error('Document manager is not available.');
  }

  // Reuse an already open notebook; otherwise open it in the background.
  const widget =
    _docManager.findWidget(path) ??
    _docManager.open(path, undefined, undefined, { activate: false });
  if (!widget) {
    throw new Error(`Could not open "${path}".`);
  }
  const panel = widget as NotebookPanel;

  // Wait until the document and its shared model are populated from disk.
  await panel.context.ready;

  const model = panel.context.model;
  if (!model || typeof (model as any).sharedModel?.addCell !== 'function') {
    throw new Error(`"${path}" is not a notebook.`);
  }

  model.sharedModel.addCell({
    cell_type: 'code',
    source,
    // Cast: the shared model's metadata type is a union of specific cell
    // metadata shapes; our free-form flag object is compatible at runtime.
    metadata: metadata as any
  });

  await panel.context.save();
}
