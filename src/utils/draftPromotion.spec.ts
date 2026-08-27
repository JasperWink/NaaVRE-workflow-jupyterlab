import { ICell } from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { makeDraftCell } from './specialCells';
import {
  baseCellTitle,
  describeIODiff,
  diffCellIO,
  findContainerizedCell,
  ioMatches,
  normalizeTitle,
  titleMatches
} from './draftPromotion';

function makeCatalogueCell(overrides: Partial<ICell>): ICell {
  return {
    url: 'http://catalogue/workflow-cells/uuid-1/',
    title: 'load-raster',
    description: '',
    container_image: 'ghcr.io/naavre/cells/load-raster:abc123',
    dependencies: [],
    inputs: [],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    ...overrides
  };
}

describe('normalizeTitle', () => {
  it('matches a human title against its containerizer slug', () => {
    expect(normalizeTitle('Load raster')).toEqual(
      normalizeTitle('load-raster')
    );
    expect(normalizeTitle('  Load   raster! ')).toEqual('load-raster');
  });

  it('distinguishes different titles', () => {
    expect(normalizeTitle('Load raster')).not.toEqual(
      normalizeTitle('Save raster')
    );
  });
});

describe('baseCellTitle', () => {
  it('strips the owner suffix the containerizer appends', () => {
    const cell = makeCatalogueCell({
      title: 'test-cell-1-test-user-2',
      owner: 'test-user-2'
    });
    expect(baseCellTitle(cell)).toBe('test-cell-1');
  });

  it('leaves a title without the owner suffix unchanged', () => {
    const cell = makeCatalogueCell({
      title: 'test-cell-1',
      owner: 'test-user-2'
    });
    expect(baseCellTitle(cell)).toBe('test-cell-1');
  });

  it('handles a missing owner', () => {
    const cell = makeCatalogueCell({ title: 'test-cell-1', owner: undefined });
    expect(baseCellTitle(cell)).toBe('test-cell-1');
  });

  it('strips a slugified email owner (special chars collapsed on both sides)', () => {
    // The server slugifies the owner into the title: someone@gmail.com becomes
    // someone-gmail-com. Normalizing the raw owner the same way bridges them.
    const cell = makeCatalogueCell({
      title: 'altitude-sensor-data-someone-gmail-com',
      owner: 'someone@gmail.com'
    });
    expect(baseCellTitle(cell)).toBe('altitude-sensor-data');
  });
});

describe('titleMatches', () => {
  it('matches a human draft title against the owner-suffixed slug', () => {
    const draft = makeDraftCell({ title: 'Altitude sensor data' });
    const cell = makeCatalogueCell({
      title: 'altitude-sensor-data-test-user-2',
      owner: 'test-user-2'
    });
    expect(titleMatches(draft, cell)).toBe(true);
  });

  it('matches an exact title with no owner suffix', () => {
    const draft = makeDraftCell({ title: 'test-cell-1' });
    const cell = makeCatalogueCell({ title: 'test-cell-1' });
    expect(titleMatches(draft, cell)).toBe(true);
  });

  it('does not match "test-cell-1" against "test-cell-12"', () => {
    const draft = makeDraftCell({ title: 'test-cell-1' });
    const cell = makeCatalogueCell({
      title: 'test-cell-12-test-user-2',
      owner: 'test-user-2'
    });
    expect(titleMatches(draft, cell)).toBe(false);
  });

  it('does not match an unrelated title', () => {
    const draft = makeDraftCell({ title: 'Load raster' });
    const cell = makeCatalogueCell({
      title: 'save-raster-test-user-2',
      owner: 'test-user-2'
    });
    expect(titleMatches(draft, cell)).toBe(false);
  });
});

describe('diffCellIO / ioMatches', () => {
  const draft = makeDraftCell({
    title: 'Load raster',
    inputs: [{ name: 'path', type: 'str' }],
    outputs: [
      { name: 'raster', type: 'list' },
      { name: 'crs', type: 'str' }
    ]
  });

  it('reports a clean match when names agree (order-insensitive)', () => {
    const cell = makeCatalogueCell({
      inputs: [{ name: 'path', type: null }],
      outputs: [
        { name: 'crs', type: null },
        { name: 'raster', type: null }
      ]
    });
    expect(ioMatches(diffCellIO(draft, cell))).toBe(true);
  });

  it('reports missing and extra variables by name', () => {
    const cell = makeCatalogueCell({
      inputs: [{ name: 'file_path', type: null }],
      outputs: [{ name: 'raster', type: null }]
    });
    const diff = diffCellIO(draft, cell);
    expect(diff.missingInputs).toEqual(['path']);
    expect(diff.extraInputs).toEqual(['file_path']);
    expect(diff.missingOutputs).toEqual(['crs']);
    expect(diff.extraOutputs).toEqual([]);
    expect(ioMatches(diff)).toBe(false);
    expect(describeIODiff(diff).join('; ')).toContain('file_path');
  });
});

describe('findContainerizedCell', () => {
  const draft = makeDraftCell({
    title: 'Load raster',
    inputs: [{ name: 'path', type: 'str' }],
    outputs: [{ name: 'raster', type: 'list' }]
  });

  it('returns no-title-match when nothing shares the title', () => {
    const cells = [makeCatalogueCell({ title: 'save-raster' })];
    expect(findContainerizedCell(cells, draft)).toEqual({
      status: 'no-title-match'
    });
  });

  it('ignores cells without a container image', () => {
    const cells = [makeCatalogueCell({ container_image: null })];
    expect(findContainerizedCell(cells, draft)).toEqual({
      status: 'no-title-match'
    });
  });

  it('returns ok for a title match with matching I/O', () => {
    const cell = makeCatalogueCell({
      inputs: [{ name: 'path', type: null }],
      outputs: [{ name: 'raster', type: null }]
    });
    const match = findContainerizedCell([cell], draft);
    expect(match).toEqual({ status: 'ok', cell });
  });

  it('matches a cell whose title carries the owner suffix', () => {
    const draftCell = makeDraftCell({
      title: 'test-cell-1',
      inputs: [{ name: 'x', type: 'int' }],
      outputs: [{ name: 'y', type: 'int' }]
    });
    const cell = makeCatalogueCell({
      title: 'test-cell-1-test-user-2',
      owner: 'test-user-2',
      inputs: [{ name: 'x', type: null }],
      outputs: [{ name: 'y', type: null }]
    });
    expect(findContainerizedCell([cell], draftCell)).toEqual({
      status: 'ok',
      cell
    });
  });

  it('picks the I/O-matching candidate among several title matches', () => {
    const mismatch = makeCatalogueCell({
      url: 'http://catalogue/workflow-cells/mismatch/',
      inputs: [{ name: 'file_path', type: null }],
      outputs: [{ name: 'raster', type: null }]
    });
    const good = makeCatalogueCell({
      url: 'http://catalogue/workflow-cells/good/',
      inputs: [{ name: 'path', type: null }],
      outputs: [{ name: 'raster', type: null }]
    });
    const match = findContainerizedCell([mismatch, good], draft);
    expect(match.status).toBe('ok');
    expect(match.status === 'ok' && match.cell.url).toContain('good');
  });

  it('reports the I/O difference when the title matches but I/O does not', () => {
    const cell = makeCatalogueCell({
      inputs: [{ name: 'file_path', type: null }],
      outputs: [{ name: 'raster', type: null }]
    });
    const match = findContainerizedCell([cell], draft);
    expect(match.status).toBe('io-mismatch');
    if (match.status === 'io-mismatch') {
      expect(match.cell.url).toContain('uuid-1');
      expect(match.diff.missingInputs).toEqual(['path']);
      expect(match.diff.extraInputs).toEqual(['file_path']);
    }
  });
});
