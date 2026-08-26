import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';

import { Contents } from '@jupyterlab/services';

import { WorkflowWidget, ExperimentManagerWidget } from './widget';

import { Workflow, WorkflowModel } from './model';

/**
 * A widget factory to create new instances of WorkflowWidget.
 */
export class WorkflowWidgetFactory extends ABCWidgetFactory<
  WorkflowWidget,
  WorkflowModel
> {
  /**
   * Constructor of WorkflowWidgetFactory.
   *
   * @param options Constructor options
   */
  constructor(options: DocumentRegistry.IWidgetFactoryOptions) {
    super(options);
  }

  /**
   * Create a new widget given a context.
   *
   * @param context Contains the information of the file
   * @returns The widget
   */
  protected createNewWidget(
    context: DocumentRegistry.IContext<WorkflowModel>
  ): WorkflowWidget {
    return new WorkflowWidget({
      context,
      content: new ExperimentManagerWidget(context)
    });
  }
}

/**
 * A Model factory to create new instances of WorkflowModel.
 */
export class WorkflowModelFactory
  implements DocumentRegistry.IModelFactory<WorkflowModel>
{
  /**
   * The name of the model.
   *
   * @returns The name
   */
  get name(): string {
    return 'naavrewf-model';
  }

  /**
   * The content type of the file.
   *
   * @returns The content type
   */
  get contentType(): Contents.ContentType {
    return 'naavrewfdoc' as any;
  }

  /**
   * The format of the file.
   *
   * @returns the file format
   */
  get fileFormat(): Contents.FileFormat {
    return 'text';
  }

  readonly collaborative: boolean = true;

  /**
   * Get whether the model factory has been disposed.
   *
   * @returns disposed status
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose the model factory.
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   * Get the preferred language given the path on the file.
   *
   * @param path path of the file represented by this document model
   * @returns The preferred language
   */
  preferredLanguage(path: string): string {
    return '';
  }

  /**
   * Create a new instance of WorkflowModel.
   *
   * @param options Model options
   * @returns The model
   */
  createNew(options: DocumentRegistry.IModelOptions<Workflow>): WorkflowModel {
    return new WorkflowModel(options);
  }

  private _disposed = false;
}
