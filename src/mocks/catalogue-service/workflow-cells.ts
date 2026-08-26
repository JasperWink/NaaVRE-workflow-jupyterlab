import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { INaaVREExternalServiceResponse } from '../../naavre-common/handler';

export const cells: ICell[] = [
  {
    url: 'http://localhost:8000/workflow-cells/cbd0bc89-7418-4536-a8c4-6eb3bb6bf2e6/',
    owner: 'fixture-user-1',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: ['test-community-1'],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [],
    inputs: [],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    title: 'shared-with-community',
    description: 'Description of shared-with-community',
    created: '2025-09-19T18:48:23.397000Z',
    modified: '2025-09-19T18:48:23.397000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/shared:93807f0f',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/cbd0bc89-7418-4536-a8c4-6eb3bb6bf2e6/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/d7fa87ca-79a3-43eb-993a-83afec93f1e4/',
    owner: 'fixture-user-1',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: ['test-virtual-lab-1'],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [],
    inputs: [],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    title: 'shared-with-vl-1',
    description: 'Description of shared-with-vl-1',
    created: '2025-09-19T18:48:23.397000Z',
    modified: '2025-09-19T18:48:23.397000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/shared:93807f0f',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/d7fa87ca-79a3-43eb-993a-83afec93f1e4/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/77e49ffb-7688-40c5-8287-6693ae3d096a/',
    owner: 'fixture-user-1',
    virtual_lab: 'test-virtual-lab-2',
    shared_with_scopes: ['test-virtual-lab-2'],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [],
    inputs: [],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    title: 'shared-with-vl-2',
    description: 'Description of shared-with-vl-2',
    created: '2025-09-19T18:48:23.397000Z',
    modified: '2025-09-19T18:48:23.397000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/shared:93807f0f',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/77e49ffb-7688-40c5-8287-6693ae3d096a/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/a9ad6181-e78c-45b0-83c1-69385b9f9404/',
    owner: 'fixture-user-1',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: [],
    shared_with_users: ['test-user-2'],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [],
    inputs: [],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    title: 'shared-with-user',
    description: 'Description of shared-with-user',
    created: '2025-09-19T18:48:23.397000Z',
    modified: '2025-09-19T18:48:23.397000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/shared:93807f0f',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/a9ad6181-e78c-45b0-83c1-69385b9f9404/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/3995b067-95fd-4706-9325-2b89339afb2c/',
    owner: 'test-user-2',
    virtual_lab: 'test-virtual-lab-2',
    shared_with_scopes: [],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [
      {
        name: 'test-dependency-1',
        module: null,
        asname: null
      },
      {
        name: 'test-dependency-2',
        module: null,
        asname: null
      }
    ],
    inputs: [],
    outputs: [
      {
        name: 'test_value_1',
        type: 'list'
      }
    ],
    confs: [
      {
        name: 'conf_test_1',
        assignation: 'conf_test_1 = 1'
      }
    ],
    params: [
      {
        name: 'param_test_1',
        type: 'str',
        default_value: 'test value'
      }
    ],
    secrets: [
      {
        name: 'secret_test_1',
        type: 'str'
      }
    ],
    title: 'other-vl-cell-1-test-user-2',
    description: 'Description of other-vl-cell-1-test-user-2',
    created: '2025-01-19T21:40:23.503000Z',
    modified: '2025-01-19T21:40:23.503000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/other-vl-cell-1:b078cae4',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/3995b067-95fd-4706-9325-2b89339afb2c/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/b6923c9e-eeb6-49fe-81f2-3df7003f8332/',
    owner: 'test-user-2',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: [],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [],
    inputs: [
      {
        name: 'test_value_1',
        type: 'list'
      }
    ],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    title: 'test-cell-2-with-a-looooooooooooooong-name-test-user-2',
    description:
      'Description of test-cell-2-with-a-looooooooooooooong-name-test-user-2',
    created: '2025-01-19T21:39:53.924000Z',
    modified: '2025-01-19T21:39:53.924000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/test-cell-2:f7b1772',
    kernel: '',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/b6923c9e-eeb6-49fe-81f2-3df7003f8332/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/d1d41322-1101-489c-82a1-8038ea999416/',
    owner: 'test-user-2',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: [],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [
      {
        name: 'test-dependency-1',
        module: null,
        asname: null
      },
      {
        name: 'test-dependency-2',
        module: null,
        asname: null
      }
    ],
    inputs: [],
    outputs: [
      {
        name: 'test_value_1',
        type: 'list'
      }
    ],
    confs: [
      {
        name: 'conf_test_1',
        assignation: 'conf_test_1 = 1'
      }
    ],
    params: [
      {
        name: 'param_test_1',
        type: 'str',
        default_value: 'test value'
      }
    ],
    secrets: [
      {
        name: 'secret_test_1',
        type: 'str'
      }
    ],
    title: 'test-cell-1-test-user-2',
    description: 'Description of test-cell-1-test-user-2',
    created: '2025-01-19T21:37:23.503000Z',
    modified: '2025-01-19T21:37:23.503000Z',
    version: 1,
    container_image: 'example.com/naavre-cells/test-cell-1:49c621b',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/d1d41322-1101-489c-82a1-8038ea999416/'
      },
      {
        version: 2,
        url: 'http://localhost:8000/workflow-cells/b58c627a-1843-421c-a897-89461ddc581a/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/b58c627a-1843-421c-a897-89461ddc581a/',
    owner: 'test-user-2',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: [],
    shared_with_users: [],
    base_container_image: {
      build: 'example.com/test-build-image:v0.0.1',
      runtime: 'example.com/test-runtime-image:v0.0.1'
    },
    dependencies: [
      {
        name: 'test-dependency-1',
        module: null,
        asname: null
      },
      {
        name: 'test-dependency-2',
        module: null,
        asname: null
      }
    ],
    inputs: [],
    outputs: [
      {
        name: 'test_value_1',
        type: 'list'
      }
    ],
    confs: [
      {
        name: 'conf_test_1',
        assignation: 'conf_test_1 = 1'
      }
    ],
    params: [
      {
        name: 'param_test_1',
        type: 'str',
        default_value: 'test value'
      }
    ],
    secrets: [
      {
        name: 'secret_test_1',
        type: 'str'
      }
    ],
    title: 'test-cell-1-test-user-2',
    description: 'Description of test-cell-1-test-user-2',
    created: '2025-01-19T21:38:23.503000Z',
    modified: '2025-01-19T21:37:23.503000Z',
    version: 2,
    container_image: 'example.com/naavre-cells/test-cell-1:7abc41dd',
    kernel: 'ipython',
    source_url: '',
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/d1d41322-1101-489c-82a1-8038ea999416/'
      },
      {
        version: 2,
        url: 'http://localhost:8000/workflow-cells/b58c627a-1843-421c-a897-89461ddc581a/'
      }
    ]
  },
  {
    url: 'http://localhost:8000/workflow-cells/5b8bdf8a-7759-4064-b23d-c6593224cbe1/',
    owner: 'test-user-2',
    virtual_lab: 'test-virtual-lab-1',
    shared_with_scopes: [],
    shared_with_users: [],
    base_container_image: null,
    dependencies: [],
    inputs: [],
    outputs: [],
    confs: [],
    params: [],
    secrets: [],
    title: 'draft-cell-1-test-user-2',
    description: '',
    created: '2025-01-19T21:37:23.503000Z',
    modified: '2025-01-19T21:37:23.503000Z',
    version: 1,
    container_image: null,
    kernel: 'ipython',
    source_url: '',
    is_draft: true,
    versions: [
      {
        version: 1,
        url: 'http://localhost:8000/workflow-cells/5b8bdf8a-7759-4064-b23d-c6593224cbe1/'
      }
    ]
  }
];

export async function getCellsList(
  request: Request
): Promise<INaaVREExternalServiceResponse> {
  return {
    status_code: 200,
    reason: 'OK',
    headers: {
      'content-type': 'application/json'
    },
    content: JSON.stringify({
      count: cells.length,
      next: null,
      previous: null,
      results: cells
    })
  };
}

export async function patchCell(
  request: Request
): Promise<INaaVREExternalServiceResponse> {
  return {
    status_code: 200,
    reason: 'OK',
    headers: {
      'content-type': 'application/json'
    },
    content: JSON.stringify(cells[0])
  };
}
