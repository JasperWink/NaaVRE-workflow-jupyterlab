import {
  ICell,
  IInput,
  IOutput
} from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';

export interface ISpecialCell extends ICell {
  type: string;
}

// Node type for user-defined "draft" nodes: placeholder cells whose inputs and
// outputs are defined in the composer, before a containerized cell (or even a
// notebook) exists. They are not backed by the catalogue.
export const DRAFT_CELL_TYPE = 'draft-cell';

export interface IDraftCellInit {
  title: string;
  description?: string;
  inputs?: Array<IInput>;
  outputs?: Array<IOutput>;
  // Reuse the existing url/id when editing an existing draft node, so the chart
  // node keeps its identity (see cellToChartNode, which derives the node id from
  // cell.url).
  url?: string;
}

function generateDraftCellUrl(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${DRAFT_CELL_TYPE}-${Date.now().toString(36)}-${rand}`;
}

// Build an ISpecialCell describing a draft node. Modelled on the Splitter/Merger
// entries below, but with a generated url, no container image, is_draft = true,
// and user-supplied title/description/inputs/outputs.
export function makeDraftCell({
  title,
  description = '',
  inputs = [],
  outputs = [],
  url
}: IDraftCellInit): ISpecialCell {
  return {
    url: url ?? generateDraftCellUrl(),
    title,
    description,
    type: DRAFT_CELL_TYPE,
    created: undefined,
    modified: undefined,
    owner: undefined,
    virtual_lab: undefined,
    shared_with_scopes: [],
    shared_with_users: [],
    version: 1,
    versions: [],
    container_image: null,
    base_container_image: {
      build: '',
      runtime: ''
    },
    dependencies: [],
    inputs,
    outputs,
    confs: [],
    params: [],
    secrets: [],
    kernel: undefined,
    source_url: undefined,
    is_draft: true
  };
}

export const specialCells: Array<ISpecialCell> = [
  {
    url: 'splitter',
    title: 'Splitter',
    description:
      'Split the input list and distribute its items to multiple containers that run in parallel.',
    type: 'splitter',
    created: undefined,
    modified: undefined,
    owner: undefined,
    virtual_lab: undefined,
    shared_with_scopes: [],
    shared_with_users: [],
    version: 1,
    versions: [],
    container_image: '',
    base_container_image: {
      build: '',
      runtime: ''
    },
    dependencies: [],
    inputs: [{ name: 'splitter_source', type: 'list' }],
    outputs: [{ name: 'splitter_target', type: 'list' }],
    confs: [],
    params: [
      {
        name: 'param_max_branches',
        type: 'int',
        default_value: ''
      }
    ],
    secrets: [],
    kernel: undefined,
    source_url: undefined
  },
  {
    url: 'merger',
    title: 'Merger',
    description:
      'Merge the output of multiple containers back into a single list.',
    type: 'merger',
    created: undefined,
    modified: undefined,
    owner: undefined,
    virtual_lab: undefined,
    shared_with_scopes: [],
    shared_with_users: [],
    version: 1,
    versions: [],
    container_image: '',
    base_container_image: {
      build: '',
      runtime: ''
    },
    dependencies: [],
    inputs: [{ name: 'merger_source', type: 'list' }],
    outputs: [{ name: 'merger_target', type: 'list' }],
    confs: [],
    params: [],
    secrets: [],
    kernel: undefined,
    source_url: undefined
  }
];
