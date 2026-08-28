const jestJupyterLab = require('@jupyterlab/testutils/lib/jest-config');

const esModules = [
  '@codemirror',
  '@jupyter/ydoc',
  '@jupyterlab/',
  'lib0',
  'nanoid',
  'vscode-ws-jsonrpc',
  'y-protocols',
  'y-websocket',
  'yjs'
].join('|');

const baseConfig = jestJupyterLab(__dirname);

module.exports = {
  ...baseConfig,
  automock: false,
  // The built labextension, an editable install's copy of it, and the
  // dev venv's bundled JupyterLab each carry a package.json whose "name"
  // duplicates one already in the tree, which jest's haste map reports as
  // a module collision. None of them is a source tree.
  modulePathIgnorePatterns: [
    '<rootDir>/venv/',
    '<rootDir>/NaaVRE_workflow_jupyterlab/labextension/'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/.ipynb_checkpoints/*'
  ],
  coverageReporters: ['lcov', 'text'],
  testRegex: 'src/.*/.*.spec.ts[x]?$',
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`]
};
