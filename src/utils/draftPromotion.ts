// Matching logic for promoting a draft node to its containerized catalogue
// cell. There is no hard provenance link between a draft and the cell the
// containerizer eventually produces (the notebook cell only carries a
// `draft_node: true` flag), so the match is made on the title: the owner
// suffix the containerizer appends is stripped off (using the cell's own
// `owner`) and the remainder must equal the draft title exactly. The
// inputs/outputs must also agree for the swap to keep the chart's links intact
// (ports are keyed by variable name, see cellToChartNode in utils/chart.ts).

import { ICell } from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';

/**
 * Normalize a title for comparison. The containerizer slugifies the notebook
 * cell's title (e.g. "Load raster" -> "load-raster"), so compare
 * case-insensitively with non-alphanumeric runs collapsed to a dash.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The base title of a catalogue cell, with the owner suffix removed. The
 * containerizer appends the owner's identifier to the title (a draft
 * "altitude-sensor-data" owned by "test-user-2" becomes
 * "altitude-sensor-data-test-user-2"), and that identifier is the cell's
 * `owner`, so strip exactly that suffix — mirroring how the node title is
 * displayed in NodeCustom.tsx. Cells with no owner suffix are left unchanged.
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
 * Whether a catalogue cell matches a draft by title, once the owner suffix is
 * stripped. An exact (normalized) equality — no prefix heuristic is needed,
 * because the suffix is removed precisely using the cell's own owner.
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
 * Compare the input/output names of a draft and a containerized cell. Names
 * are what the chart's ports (and therefore links) are keyed on, so they must
 * agree exactly for a replace-in-place to preserve the wiring.
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

/**
 * Human-readable lines describing an I/O mismatch, for the error shown to the
 * user.
 */
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
 * Find the containerized catalogue cell that matches a draft node.
 *
 * Candidates are catalogue cells that have a container image and whose title
 * (owner suffix stripped) matches the draft's exactly. Re-containerizing a cell
 * replaces the previous version in the catalogue, so at most one such cell is
 * expected; if its inputs/outputs also match, it is the result. Otherwise the
 * title match is reported together with the difference so the user can fix
 * either side.
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
