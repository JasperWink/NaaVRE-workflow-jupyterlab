import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';
import { codeIcon, runIcon, saveIcon } from '@jupyterlab/ui-components';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { WorkflowWidget } from './widget';

export namespace ToolbarItems {
  export function createSaveButton(
    widget: WorkflowWidget,
    commands: CommandRegistry
  ): Widget {
    return new ToolbarButton({
      label: 'Save',
      tooltip: 'Save the workflow',
      icon: saveIcon,
      onClick: () => {
        commands.execute('docmanager:save');
      }
    });
  }

  export function createExportButton(
    widget: WorkflowWidget,
    browserFactory: IFileBrowserFactory
  ): Widget {
    return new ToolbarButton({
      label: 'Export',
      tooltip: 'Export the workflow',
      icon: codeIcon,
      onClick: () => {
        widget.content.composerRef.current?.exportWorkflow(browserFactory);
      }
    });
  }

  export function createRunButton(widget: WorkflowWidget): Widget {
    return new ToolbarButton({
      label: 'Run',
      tooltip: 'Run the workflow',
      icon: runIcon,
      onClick: () =>
        widget.content.composerRef.current?.setRunWorkflowDialogOpen(true)
    });
  }
}
