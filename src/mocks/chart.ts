import { IChart } from '../utils/chart';

export const chart: IChart = {
  offset: {
    x: 0,
    y: 0
  },
  scale: 1,
  nodes: {
    '9862c7b5-d539-40ab-8403-2bf660487df6': {
      id: '9862c7b5-d539-40ab-8403-2bf660487df6',
      position: {
        x: 706,
        y: 195
      },
      orientation: 0,
      type: 'splitter',
      ports: {
        splitter_source: {
          id: 'splitter_source',
          type: 'left',
          properties: {
            color: '#86642d',
            parentNodeType: 'splitter'
          },
          position: {
            x: -2,
            y: 50
          }
        },
        splitter_target: {
          id: 'splitter_target',
          type: 'right',
          properties: {
            color: '#5940bf',
            parentNodeType: 'splitter'
          },
          position: {
            x: 202,
            y: 50
          }
        }
      },
      properties: {
        cell: {
          url: 'splitter',
          title: 'Splitter',
          version: 1,
          versions: [],
          container_image: '',
          dependencies: [],
          inputs: [
            {
              name: 'splitter_source',
              type: 'list'
            }
          ],
          outputs: [
            {
              name: 'splitter_target',
              type: 'list'
            }
          ],
          confs: [],
          params: [
            {
              name: 'param_max_branches',
              type: 'int',
              default_value: undefined
            }
          ],
          secrets: [],
          shared_with_scopes: [],
          shared_with_users: []
        }
      },
      size: {
        width: 202,
        height: 102
      }
    },
    '31480c91-1788-4b5e-846d-59602d92afe5': {
      id: '31480c91-1788-4b5e-846d-59602d92afe5',
      position: {
        x: 1020,
        y: 179
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {
        test_value_1: {
          id: 'test_value_1',
          type: 'left',
          properties: {
            color: '#e06c98',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 38.5,
            y: 75
          }
        }
      },
      properties: {
        cell: {
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
          versions: [
            {
              version: 1,
              url: 'http://localhost:8000/workflow-cells/b6923c9e-eeb6-49fe-81f2-3df7003f8332/'
            }
          ],
          container_image: 'example.com/naavre-cells/test-cell-2:f7b1772',
          kernel: '',
          source_url: ''
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    '61c83deb-7fe6-4f04-ae16-913d2feeebfa': {
      id: '61c83deb-7fe6-4f04-ae16-913d2feeebfa',
      position: {
        x: 689,
        y: 566
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {},
      properties: {
        cell: {
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
          versions: [
            {
              version: 1,
              url: 'http://localhost:8000/workflow-cells/d7fa87ca-79a3-43eb-993a-83afec93f1e4/'
            }
          ],
          container_image: 'example.com/naavre-cells/shared:93807f0f',
          kernel: 'ipython',
          source_url: ''
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    '32a8a543-b04c-4a50-a201-79320afe153c': {
      id: '32a8a543-b04c-4a50-a201-79320afe153c',
      position: {
        x: 344,
        y: 561
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {},
      properties: {
        cell: {
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
          versions: [
            {
              version: 1,
              url: 'http://localhost:8000/workflow-cells/a9ad6181-e78c-45b0-83c1-69385b9f9404/'
            }
          ],
          container_image: 'example.com/naavre-cells/shared:93807f0f',
          kernel: 'ipython',
          source_url: ''
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    '3f73c690-dbf3-4385-9185-a2945d788aec': {
      id: '3f73c690-dbf3-4385-9185-a2945d788aec',
      position: {
        x: 342,
        y: 175
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {
        test_value_1: {
          id: 'test_value_1',
          type: 'right',
          properties: {
            color: '#e06c98',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 211.5,
            y: 75
          }
        }
      },
      properties: {
        cell: {
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
              name: 'param_z',
              type: 'str',
              default_value: undefined
            },
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
          versions: [
            {
              version: 1,
              url: 'http://localhost:56848/workflow-cells/d1d41322-1101-489c-82a1-8038ea999416/'
            },
            {
              version: 2,
              url: 'http://localhost:56848/workflow-cells/b58c627a-1843-421c-a897-89461ddc581a/'
            }
          ],
          container_image:
            'ghcr.io/naavre/cells-vl-openlab/test-py-input-list-gabriel-pelouze-lifewatch-eu:b6301bf',
          kernel: 'ipython',
          source_url:
            'https://github.com/NaaVRE/cells-vl-openlab/tree/49c8e8db12af5350c26b699da1300884c91a76dc/test-py-input-list-gabriel-pelouze-lifewatch-eu'
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    '6e24bde4-4d6f-4603-8f18-d6867e78a63a': {
      id: '6e24bde4-4d6f-4603-8f18-d6867e78a63a',
      position: {
        x: 710,
        y: 389
      },
      orientation: 0,
      type: 'merger',
      ports: {
        merger_source: {
          id: 'merger_source',
          type: 'left',
          properties: {
            color: '#1f9384',
            parentNodeType: 'merger'
          },
          position: {
            x: -2,
            y: 50
          }
        },
        merger_target: {
          id: 'merger_target',
          type: 'right',
          properties: {
            color: '#562d86',
            parentNodeType: 'merger'
          },
          position: {
            x: 202,
            y: 50
          }
        }
      },
      properties: {
        cell: {
          url: 'merger',
          title: 'Merger',
          version: 1,
          versions: [],
          container_image: '',
          dependencies: [],
          inputs: [
            {
              name: 'merger_source',
              type: 'list'
            }
          ],
          outputs: [
            {
              name: 'merger_target',
              type: 'list'
            }
          ],
          confs: [],
          params: [],
          secrets: [],
          shared_with_scopes: [],
          shared_with_users: []
        }
      },
      size: {
        width: 202,
        height: 102
      }
    },
    '740d4189-c7ac-4453-a359-a294058f9326': {
      id: '740d4189-c7ac-4453-a359-a294058f9326',
      position: {
        x: 345,
        y: 374
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {
        test_value_1: {
          id: 'test_value_1',
          type: 'right',
          properties: {
            color: '#e06c98',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 211.5,
            y: 75
          }
        }
      },
      properties: {
        cell: {
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
              url: 'http://localhost:56848/workflow-cells/d1d41322-1101-489c-82a1-8038ea999416/'
            },
            {
              version: 2,
              url: 'http://localhost:56848/workflow-cells/b58c627a-1843-421c-a897-89461ddc581a/'
            }
          ]
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    'd953ae8b-834c-43fe-b47c-79040cabca56': {
      id: 'd953ae8b-834c-43fe-b47c-79040cabca56',
      position: {
        x: 1025,
        y: 369
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {
        test_value_1: {
          id: 'test_value_1',
          type: 'left',
          properties: {
            color: '#e06c98',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 38.5,
            y: 75
          }
        }
      },
      properties: {
        cell: {
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
          versions: [
            {
              version: 1,
              url: 'http://localhost:8000/workflow-cells/b6923c9e-eeb6-49fe-81f2-3df7003f8332/'
            }
          ],
          container_image: 'example.com/naavre-cells/test-cell-2:f7b1772',
          kernel: '',
          source_url: ''
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    '5573511e-fca7-4c58-988c-30311d49fa24': {
      id: '5573511e-fca7-4c58-988c-30311d49fa24',
      position: {
        x: 1031,
        y: 567
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {},
      properties: {
        cell: {
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
          versions: [
            {
              version: 1,
              url: 'http://localhost:8000/workflow-cells/cbd0bc89-7418-4536-a8c4-6eb3bb6bf2e6/'
            }
          ],
          container_image: 'example.com/naavre-cells/shared:93807f0f',
          kernel: 'ipython',
          source_url: ''
        }
      },
      size: {
        width: 252,
        height: 152
      }
    },
    'ee0e222d-4c89-42b5-a3aa-08ca3e9442a4': {
      id: 'ee0e222d-4c89-42b5-a3aa-08ca3e9442a4',
      position: {
        x: 691.4478114478113,
        y: 768.0134680134685
      },
      orientation: 0,
      type: 'workflow-cell',
      ports: {
        'input-1': {
          id: 'input-1',
          type: 'left',
          properties: {
            color: '#382dd2',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 13
          }
        },
        'input-2': {
          id: 'input-2',
          type: 'left',
          properties: {
            color: '#45783a',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 39
          }
        },
        'input-3': {
          id: 'input-3',
          type: 'left',
          properties: {
            color: '#59bf40',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 65
          }
        },
        'input-4-with-a-loooooooooooooong-name': {
          id: 'input-4-with-a-loooooooooooooong-name',
          type: 'left',
          properties: {
            color: '#8d931f',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 169
          }
        },
        'input-5': {
          id: 'input-5',
          type: 'left',
          properties: {
            color: '#866d2d',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 91
          }
        },
        'input-6': {
          id: 'input-6',
          type: 'left',
          properties: {
            color: '#e09e6c',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 117
          }
        },
        'input-7': {
          id: 'input-7',
          type: 'left',
          properties: {
            color: '#d6e06c',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 53,
            y: 143
          }
        },
        'output-1': {
          id: 'output-1',
          type: 'right',
          properties: {
            color: '#8b79d2',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 197,
            y: 13
          }
        },
        'output-2': {
          id: 'output-2',
          type: 'right',
          properties: {
            color: '#a4c587',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 197,
            y: 39
          }
        },
        'output-3': {
          id: 'output-3',
          type: 'right',
          properties: {
            color: '#6cbfe0',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 197,
            y: 65
          }
        },
        'output-4-with-a-looooooooooooong-name': {
          id: 'output-4-with-a-looooooooooooong-name',
          type: 'right',
          properties: {
            color: '#d22d45',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 197,
            y: 91
          }
        },
        'output-5': {
          id: 'output-5',
          type: 'right',
          properties: {
            color: '#9bc587',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 197,
            y: 117
          }
        },
        'output-6': {
          id: 'output-6',
          type: 'right',
          properties: {
            color: '#1f9391',
            parentNodeType: 'workflow-cell'
          },
          position: {
            x: 197,
            y: 143
          }
        }
      },
      properties: {
        cell: {
          url: 'http://localhost:8000/workflow-cells/383fae90-c7be-4e87-b9f5-3183b1b8058a/',
          owner: 'test-user-2',
          virtual_lab: 'test-virtual-lab-1',
          shared_with_scopes: [],
          shared_with_users: [],
          base_container_image: null,
          dependencies: [],
          inputs: [
            {
              name: 'input-1',
              type: 'str'
            },
            {
              name: 'input-2',
              type: 'str'
            },
            {
              name: 'input-3',
              type: 'list'
            },
            {
              name: 'input-5',
              type: 'str'
            },
            {
              name: 'input-6',
              type: 'str'
            },
            {
              name: 'input-7',
              type: 'str'
            },
            {
              name: 'input-4-with-a-loooooooooooooong-name',
              type: 'str'
            }
          ],
          outputs: [
            {
              name: 'output-1',
              type: 'int'
            },
            {
              name: 'output-2',
              type: 'int'
            },
            {
              name: 'output-3',
              type: 'int'
            },
            {
              name: 'output-4-with-a-looooooooooooong-name',
              type: 'int'
            },
            {
              name: 'output-5',
              type: 'int'
            },
            {
              name: 'output-6',
              type: 'int'
            }
          ],
          confs: [],
          params: [],
          secrets: [],
          title: 'test-cell-3-test-user-2',
          description: 'Description of test-cell-3-test-user-2',
          created: '2025-10-07T08:57:38.023654Z',
          modified: '2025-10-07T09:00:25.258582Z',
          version: 1,
          versions: [
            {
              version: 1,
              url: 'http://localhost:8000/workflow-cells/383fae90-c7be-4e87-b9f5-3183b1b8058a/'
            }
          ],
          container_image: 'test',
          kernel: '',
          source_url: ''
        }
      },
      size: {
        width: 252,
        height: 152
      }
    }
  },
  links: {
    '5e0433e2-efbf-49c9-aec1-3b14e1c9fca5': {
      id: '5e0433e2-efbf-49c9-aec1-3b14e1c9fca5',
      from: {
        nodeId: '3f73c690-dbf3-4385-9185-a2945d788aec',
        portId: 'test_value_1'
      },
      to: {
        nodeId: '9862c7b5-d539-40ab-8403-2bf660487df6',
        portId: 'splitter_source'
      }
    },
    '76db8048-88d0-41e2-8251-aae72aea2598': {
      id: '76db8048-88d0-41e2-8251-aae72aea2598',
      from: {
        nodeId: '9862c7b5-d539-40ab-8403-2bf660487df6',
        portId: 'splitter_target'
      },
      to: {
        nodeId: '31480c91-1788-4b5e-846d-59602d92afe5',
        portId: 'test_value_1'
      }
    },
    '218638c6-2f3b-4df7-9a1f-e447db860acc': {
      id: '218638c6-2f3b-4df7-9a1f-e447db860acc',
      from: {
        nodeId: '740d4189-c7ac-4453-a359-a294058f9326',
        portId: 'test_value_1'
      },
      to: {
        nodeId: '6e24bde4-4d6f-4603-8f18-d6867e78a63a',
        portId: 'merger_source'
      }
    },
    'ef56e732-8e7d-49ff-8f8e-f42ce45bf99e': {
      id: 'ef56e732-8e7d-49ff-8f8e-f42ce45bf99e',
      from: {
        nodeId: '6e24bde4-4d6f-4603-8f18-d6867e78a63a',
        portId: 'merger_target'
      },
      to: {
        nodeId: 'd953ae8b-834c-43fe-b47c-79040cabca56',
        portId: 'test_value_1'
      }
    }
  },
  properties: {
    params: []
  },
  selected: {
    type: 'node',
    id: '3f73c690-dbf3-4385-9185-a2945d788aec'
  },
  hovered: {}
};
