import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  createToolbarFactory,
  IToolbarWidgetRegistry,
  IWidgetTracker,
  ToolbarRegistry,
  WidgetTracker
} from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ICollaborativeContentProvider } from '@jupyter/collaborative-drive';
import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { IObservableList } from '@jupyterlab/observables';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { WorkflowModelFactory, WorkflowWidgetFactory } from './factory';
import { WorkflowWidget } from './widget';
import { Workflow } from './model';
import { ISettings } from './settings';
import { ToolbarItems } from './toolbarItems';
import { Commands, CommandIDs } from './commands';
import { setDocumentManager } from './naavre-common/notebook';
import { setCommandRegistry } from './boardAccess';

/**
 * The name of the factory that creates editor widgets.
 */
const FACTORY = 'NaaVRE workflow editor';

// Export a token so other extensions can require it
export const IWorkflowTracker = new Token<IWidgetTracker<WorkflowWidget>>(
  'naavrewfDocTracker'
);

/**
 * Initialization data for the documents extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: '@naavre/workflow-jupyterlab:plugin',
  autoStart: true,
  requires: [
    ILayoutRestorer,
    ILauncher,
    ITranslator,
    IToolbarWidgetRegistry,
    ISettingRegistry,
    IFileBrowserFactory
  ],
  optional: [IDocumentManager, ICollaborativeContentProvider],
  provides: IWorkflowTracker,
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    launcher: ILauncher,
    translator: ITranslator,
    toolbarRegistry: IToolbarWidgetRegistry | null,
    settingRegistry: ISettingRegistry | null,
    browserFactory: IFileBrowserFactory,
    docManager: IDocumentManager | null,
    contentProvider: ICollaborativeContentProvider | null
  ) => {
    console.log(
      'JupyterLab extension @naavre/workflow-jupyterlab is activated!'
    );
    Commands.addCommands(app.commands, browserFactory, FACTORY);

    // Make the document manager available to the composer so draft nodes can
    // insert cells into a notebook's live shared model (see AddToNotebookDialog).
    setDocumentManager(docManager);

    // Make the command registry available to the composer so draft nodes can
    // put cards on the NaaVRE task board, if that extension is installed
    // (see src/boardAccess.ts).
    setCommandRegistry(app.commands);

    if (launcher) {
      launcher.add({
        command: CommandIDs.createNew,
        category: 'VRE Components',
        rank: 0
      });
    }

    // Toolbar
    let toolbarFactory:
      | ((widget: Widget) => IObservableList<ToolbarRegistry.IToolbarItem>)
      | undefined;
    // Register notebook toolbar specific widgets
    if (toolbarRegistry) {
      toolbarRegistry.registerFactory<WorkflowWidget>(
        FACTORY,
        'saveWorkflow',
        widget => ToolbarItems.createSaveButton(widget, app.commands)
      );
      toolbarRegistry.registerFactory<WorkflowWidget>(
        FACTORY,
        'exportWorkflow',
        widget => ToolbarItems.createExportButton(widget, browserFactory)
      );
      toolbarRegistry.registerFactory<WorkflowWidget>(
        FACTORY,
        'runWorkflow',
        widget => ToolbarItems.createRunButton(widget)
      );
      if (settingRegistry) {
        toolbarFactory = createToolbarFactory(
          toolbarRegistry,
          settingRegistry,
          FACTORY,
          extension.id,
          translator
        );
      }
    }

    // Namespace for the tracker
    const namespace = 'documents-naavrewf';
    // Creating the tracker for the document
    const tracker = new WidgetTracker<WorkflowWidget>({ namespace });

    // Handle state restoration.
    if (restorer) {
      // When restoring the app, if the document was open, reopen it
      restorer.restore(tracker, {
        command: 'docmanager:open',
        args: widget => ({ path: widget.context.path, factory: FACTORY }),
        name: widget => widget.context.path
      });
    }

    // Load settings
    function loadSettings(settings: ISettingRegistry.ISettings): void {
      tracker.currentWidget?.updateSettings(
        settings.composite as Partial<ISettings>
      );
    }
    if (settingRegistry) {
      Promise.all([app.restored, settingRegistry.load(extension.id)])
        .then(([, settings]) => {
          loadSettings(settings);
          settings.changed.connect(loadSettings);
          tracker.currentChanged.connect(() => loadSettings(settings));
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for @naavre/containerizer-jupyterlab.',
            reason
          );
        });
    }

    // register the filetype
    app.docRegistry.addFileType({
      name: 'naavrewf',
      displayName: 'NaaVRE Workflow',
      mimeTypes: ['text/json', 'application/json'],
      extensions: ['.naavrewf'],
      fileFormat: 'text',
      contentType: 'naavrewfdoc' as any
    });

    // Creating and registering the model factory for our custom DocumentModel
    const modelFactory = new WorkflowModelFactory();
    app.docRegistry.addModelFactory(modelFactory);

    // Creating the widget factory to register it so the document manager knows about
    // our new DocumentWidget
    const widgetFactory = new WorkflowWidgetFactory({
      name: FACTORY,
      modelName: 'naavrewf-model',
      fileTypes: ['naavrewf'],
      defaultFor: ['naavrewf'],
      toolbarFactory: toolbarFactory
    });

    // Enable real-time collaboration for .naavrewf when the jupyter-collaboration
    // content provider is available. The key ('naavrewfdoc') is the document's
    // content type and must match the model factory (src/factory.ts) and the
    // server-side YDoc entry point (pyproject.toml). Without the contentProviderId
    // the document opens as an independent, single-user copy and never syncs.
    if (contentProvider) {
      contentProvider.sharedModelFactory.registerDocumentFactory(
        'naavrewfdoc' as any,
        () => Workflow.create()
      );
      widgetFactory.contentProviderId = 'rtc';
      console.log(
        '@naavre/workflow-jupyterlab: real-time collaboration enabled for .naavrewf'
      );
    }

    // Add the widget to the tracker when it's created
    widgetFactory.widgetCreated.connect((sender, widget) => {
      // Notify the instance tracker if restore data needs to update.
      widget.context.pathChanged.connect(() => {
        tracker.save(widget);
      });
      tracker.add(widget);
    });

    // Registering the widget factory
    app.docRegistry.addWidgetFactory(widgetFactory);
  }
};

export default extension;
