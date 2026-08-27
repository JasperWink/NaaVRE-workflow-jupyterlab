import { IDocumentManager } from '@jupyterlab/docmanager';
import { NotebookPanel } from '@jupyterlab/notebook';

// The JupyterLab document manager, registered once from the extension's
// activate function (see index.ts). It lets us open notebooks and write into
// their live (shared) model, so an added cell appears immediately in an already
// open notebook instead of only landing on disk.
let _docManager: IDocumentManager | null = null;

export function setDocumentManager(docManager: IDocumentManager | null): void {
  _docManager = docManager;
}

// Whether live notebook insertion is available (i.e. the document manager was
// registered). When false, callers should fall back to writing the file via the
// Contents API.
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

// Append a code cell to the notebook at `path`'s live shared model, then save.
// Because we write to the shared model rather than the file on disk, the new
// cell shows up immediately in the notebook (and is persisted on save) — no need
// to close and reopen. If the notebook is already open we reuse that view; if
// not, it is opened in the background so focus stays on the workflow composer.
// The notebook must already exist on disk.
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
