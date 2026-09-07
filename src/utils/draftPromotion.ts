// Promoting a draft node to its containerized cell. No provenance link exists,
// so drafts are matched on title (owner suffix stripped) and the I/O must agree
// for the swap to keep the chart's links.

import { ICell } from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';

/**
 * Normalize a title for comparison: the containerizer slugifies titles
 * ("Load raster" -> "load-raster"), so lowercase and dash non-alphanumerics.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * A cell's title with the owner suffix removed: the containerizer appends the
 * cell's `owner` ("foo" owned by "user-2" -> "foo-user-2"), so strip that.
 */
export function baseCellTitle(cell: ICell): string {
  const title = normalizeTitle(cell.title);
  const owner = cell.owner ? normalizeTitle(cell.owner) : '';
  if (owner && title.endsWith(`-${owner}`)) {
    return title.slice(0, -(owner.length + 1));
  }
  return title;
}

/**
 * Whether a cell matches a draft by title once the owner suffix is stripped.
 */
export function titleMatches(draft: ICell, cell: ICell): boolean {
  const wanted = normalizeTitle(draft.title);
  return wanted !== '' && baseCellTitle(cell) === wanted;
}

export interface IIODiff {
  /** Draft inputs the containerized cell does not have. */
  missingInputs: string[];
  /** Containerized-cell inputs the draft does not have. */
  extraInputs: string[];
  /** Draft outputs the containerized cell does not have. */
  missingOutputs: string[];
  /** Containerized-cell outputs the draft does not have. */
  extraOutputs: string[];
}

function diffNames(
  draftVars: Array<{ name: string }>,
  cellVars: Array<{ name: string }>
): [string[], string[]] {
  const draftNames = new Set(draftVars.map(v => v.name));
  const cellNames = new Set(cellVars.map(v => v.name));
  return [
    [...draftNames].filter(n => !cellNames.has(n)),
    [...cellNames].filter(n => !draftNames.has(n))
  ];
}

/**
 * Compare I/O names of a draft and a cell. Ports are keyed on them, so they
 * must agree exactly for a replace-in-place to preserve the wiring.
 */
export function diffCellIO(draft: ICell, cell: ICell): IIODiff {
  const [missingInputs, extraInputs] = diffNames(draft.inputs, cell.inputs);
  const [missingOutputs, extraOutputs] = diffNames(draft.outputs, cell.outputs);
  return { missingInputs, extraInputs, missingOutputs, extraOutputs };
}

export function ioMatches(diff: IIODiff): boolean {
  return (
    diff.missingInputs.length === 0 &&
    diff.extraInputs.length === 0 &&
    diff.missingOutputs.length === 0 &&
    diff.extraOutputs.length === 0
  );
}

/** Human-readable lines describing an I/O mismatch, for the user's error. */
export function describeIODiff(diff: IIODiff): string[] {
  const lines: string[] = [];
  if (diff.missingInputs.length > 0) {
    lines.push(
      `inputs missing on the containerized cell: ${diff.missingInputs.join(', ')}`
    );
  }
  if (diff.extraInputs.length > 0) {
    lines.push(
      `extra inputs on the containerized cell: ${diff.extraInputs.join(', ')}`
    );
  }
  if (diff.missingOutputs.length > 0) {
    lines.push(
      `outputs missing on the containerized cell: ${diff.missingOutputs.join(', ')}`
    );
  }
  if (diff.extraOutputs.length > 0) {
    lines.push(
      `extra outputs on the containerized cell: ${diff.extraOutputs.join(', ')}`
    );
  }
  return lines;
}

export type PromotionMatch =
  | { status: 'ok'; cell: ICell }
  | { status: 'no-title-match' }
  | { status: 'io-mismatch'; cell: ICell; diff: IIODiff };

/**
 * Find the containerized cell matching a draft: has an image, and its stripped
 * title matches exactly. Mismatched I/O is reported rather than applied.
 */
export function findContainerizedCell(
  cells: ICell[],
  draft: ICell
): PromotionMatch {
  const candidates = cells.filter(
    cell =>
      !cell.is_draft && !!cell.container_image && titleMatches(draft, cell)
  );

  if (candidates.length === 0) {
    return { status: 'no-title-match' };
  }

  const exact = candidates.find(cell => ioMatches(diffCellIO(draft, cell)));
  if (exact) {
    return { status: 'ok', cell: exact };
  }
  return {
    status: 'io-mismatch',
    cell: candidates[0],
    diff: diffCellIO(draft, candidates[0])
  };
}
