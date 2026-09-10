# NaaVRE_workflow_jupyterlab

[![Github Actions Status](https://github.com/NaaVRE/NaaVRE-workflow-jupyterlab/workflows/Build/badge.svg)](https://github.com/NaaVRE/NaaVRE-workflow-jupyterlab/actions/workflows/build.yml)

NaaVRE workflow editor frontend on Jupyter Lab

## What this fork adds
Forked from upstream at `79cd459` (0.6.2). Three features on top of the published extension:

- **Real-time collaboration on `.naavrewf`.** Several people can edit one workflow at once. The chart is stored in a Yjs document under one key per node and link, so concurrent edits to different elements merge instead of overwriting each other. Each client also publishes which node it has open, drawn as a coloured ring and a name flag.
- **Draft nodes.** Placeholder nodes with their own inputs and outputs, authored in the composer before a containerized cell exists, so a workflow can be sketched end to end and the cells filled in afterwards. A draft can be exported into a notebook as a pre-formatted code cell (Python or R) and later swapped in place for its containerized catalogue cell.
- **Task board integration.** A draft can be pushed to [NaaVRE-taskboard-jupyterlab](../NaaVRE-taskboard-jupyterlab) as a card. Optional — the button only appears when that extension is installed in the same JupyterLab.

`INTEGRATION.md` in the parent folder documents every added and modified file, and the constraints that break silently if they are missed.

## Requirements

- JupyterLab >= 4.0.0
- **For collaboration:** Python >= 3.10 and JupyterLab >= 4.5, < 4.6. See the `collaboration` extra in `pyproject.toml` — the pins there are deliberate and explained in place.

## Install

To install the extension, execute:

```bash
pip install NaaVRE_workflow_jupyterlab
```

Note that this installs the published upstream extension, which does **not** include the features above. For those, install this repository from source.

## Uninstall

To remove the extension, execute:

```bash
pip uninstall NaaVRE_workflow_jupyterlab
```

## Contributing

### Development install

The quickest path is the script at the root of this repository, which brings up the backing services, creates a virtual environment, installs and builds the extension, and starts JupyterLab:

```bash
./run.sh          # everything, then launch
./run.sh --down   # stop the backing services
```

To run this extension **together with the task board**, use `../run.sh` instead. Both extensions have to live in one JupyterLab: the task-board button is resolved through the shared command registry, and the collaboration server resolves both document types from `jupyter_ydoc` entry points registered in the environment serving them. Split them and the button silently never appears, while the board stops syncing.

<details>
<summary>Manual setup, if you would rather not use the script</summary>

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the NaaVRE_workflow_jupyterlab directory
# Create a virtual environment and activate it — Python 3.10+ for collaboration
python3 -m venv venv
. venv/bin/activate
# Install jupyterlab
pip install 'jupyterlab>=4.0.0,<5'
# Install package in development mode.
# The [collaboration] extra is what enables real-time collaboration; without it
# the extension works, but every .naavrewf opens single-user and nothing says so.
pip install -e ".[collaboration]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

This extension communicates with external NaaVRE services. During development, you can run a local
version of those services with Docker compose. Initial setup:

1. Create a file `./dev/workflow-config.json` by copying `./dev/workflow-config-example.json` and fill-in values for `api_endpoint` and `access_token`. To obtain these values, either use an existing argo instance, or run [NaaVRE/NaaVRE-dev-integration](https://github.com/NaaVRE/NaaVRE-dev-integration), and run `echo "Bearer $(kubectl get secret vre-api.service-account-token -o=jsonpath='{.data.token}' | base64 --decode)"` to get the access token. (TODO: this should be simplified in the future, after addressing NaaVRE/NaaVRE-workflow-service#1.)
2. Merge the Jupyter Lab configuration into the environment's settings. **Merge rather than copy** —
   `overrides.json` is shared with the other NaaVRE extensions, and copying over it wipes the
   containerizer's service URLs, which then fails without an error.
   ```bash
   mkdir -p venv/share/jupyter/lab/settings/
   # `./run.sh` does this merge for you; see the MERGE block in that script.
   ```
3. Start docker compose. `dev/docker-compose.local.yaml` is a git-ignored overlay that adds the
   containerizer service and, on Apple Silicon, the `linux/amd64` platform overrides — without it
   you get a stack with no containerizer.
   ```bash
   docker compose -f dev/docker-compose.yaml -f dev/docker-compose.local.yaml up
   ```

</details>

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
while IFS= read -r env; do case "$env" in ''|\#*) continue;; esac; export "$env"; done < ./dev/jupyterlab.env
jupyter lab --notebook-dir ./notebook-dir
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall NaaVRE_workflow_jupyterlab
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `@naavre/workflow-jupyterlab` within that folder.

### Isolated component development

Rebuilding the extension and refreshing JupyterLab to see changes in the browser takes several seconds. This makes it hard to quickly iterate on presentation aspects such as layout.

To get a quick preview of some components, we use [Storybook](https://storybook.js.org/):

```shell
jlpm run storybook
```

Note that in Storybook, components don’t get the full context from Jupyter Lab and rely on some mocking. To access all interaction features, you still need to run it in JupyterLab.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

The collaboration and draft-node features are covered by `src/utils/chartMerge.spec.ts`,
`src/utils/workflowModel.spec.ts` and `src/__tests__/widgetSync.spec.ts`. The last of these reproduces the concurrent-editing bugs found during development, so a failure there means a merge-semantics regression rather than a broken test.

#### Manual collaboration check

Some behaviour has no automated coverage. Open one `.naavrewf` in two browsers and confirm that: edits in one appear in the other; a node deleted in one disappears in the other; each sees the other's coloured ring on a selected node; and a file saved with collaboration enabled is byte-identical to the same file saved with it disabled.

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
