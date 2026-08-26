import { ICell } from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';

export interface ISpecialCell extends ICell {
  type: string;
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
