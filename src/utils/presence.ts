// Per-client presence over the document's awareness channel: never written to
// the document, never saved, and expiring on disconnect. It does not resolve
// conflicts — it makes them visible before they happen.

/** Awareness field under which this extension advertises the local selection. */
export const SELECTION_FIELD = 'workflowSelection';

/** What a client advertises about the node it currently has open. */
export interface IWorkflowSelection {
  /** Id of the selected node, or null when nothing is selected. */
  nodeId: string | null;
  /** Whether an editing dialog is open on that node, as opposed to it merely
   * being selected. */
  editing: boolean;
}

/** A remote collaborator, as rendered on a node. */
export interface ICollaborator {
  clientId: number;
  /** Display name, falling back through the identity fields then a placeholder. */
  name: string;
  /** Colour assigned by JupyterLab, used for the outline and the flag. */
  color: string;
  editing: boolean;
}

/** Remote collaborators keyed by the id of the node they are on. */
export type INodePresence = Record<string, Array<ICollaborator>>;

const FALLBACK_COLOR = '#7b8a88';
const FALLBACK_NAME = 'Anonymous';

/** Read a non-empty string off an untrusted object, or return null. */
function readString(source: any, key: string): string | null {
  const value = source?.[key];
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Per-node collaborator lists from raw awareness states. Remote states are
 * arbitrary JSON, so malformed ones are skipped; the local client is excluded.
 */
export function collectNodePresence(
  states: Map<number, any>,
  localClientId: number
): INodePresence {
  const presence: INodePresence = {};
  states.forEach((state, clientId) => {
    if (clientId === localClientId || !state) {
      return;
    }
    const nodeId = readString(state[SELECTION_FIELD], 'nodeId');
    if (nodeId === null) {
      return;
    }
    // `user` is set by @jupyter/docprovider from the JupyterLab user identity;
    // it is absent when the document is open without collaboration.
    const user = state.user;
    if (!(nodeId in presence)) {
      presence[nodeId] = [];
    }
    presence[nodeId].push({
      clientId,
      name:
        readString(user, 'display_name') ??
        readString(user, 'name') ??
        readString(user, 'username') ??
        FALLBACK_NAME,
      color: readString(user, 'color') ?? FALLBACK_COLOR,
      editing: state[SELECTION_FIELD]?.editing === true
    });
  });
  // Order by client id so flags keep their places across re-renders.
  Object.values(presence).forEach(collaborators =>
    collaborators.sort((a, b) => a.clientId - b.clientId)
  );
  return presence;
}

/**
 * Black or white text for the given colour: JupyterLab assigns user colours
 * across the whole hue range, where a fixed text colour is unreadable.
 */
export function readableTextColor(background: string): string {
  const hex = background.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map(c => c + c)
          .join('')
      : hex;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) {
    return '#ffffff';
  }
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  // Perceived luminance (ITU-R BT.601), the usual cheap approximation.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}
