// Derived from https://github.com/jupyterlab/extension-examples/blob/2b9283f611d2471f8ac310704a3c6a896cbc1e07/documents/src/model.ts
// Copyright 2023 Project Jupyter Contributors; licensed under the BSD 3-Clause License license:
// https://github.com/jupyterlab/extension-examples/blob/main/LICENSE
//
// The chart lives under granular keys in `content` ('node:<id>', 'link:<id>'),
// so Yjs merges concurrent edits to different elements instead of last-write-
// wins. View state (offset, scale, selected, hovered) is per-client and is
// never stored.

import { YDocument, DocumentChange } from '@jupyter/ydoc';

import { IChangedArgs } from '@jupyterlab/coreutils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { PartialJSONValue } from '@lumino/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

import { ILink } from '@mrblenny/react-flow-chart';

import { defaultChart, IChart, INode } from './utils/chart';
import { migrateChart } from './utils/chartMigrations';

import * as Y from 'yjs';

/**
 * Document structure
 */
export type SharedObject = {
  chart: IChart;
};

const NODE_KEY_PREFIX = 'node:';
const LINK_KEY_PREFIX = 'link:';
// Chart-level content; the other top-level fields are view state and not stored.
const PROPERTIES_KEY = 'properties';
const METADATA_KEY = 'metadata';

/** JSON.parse that degrades to a fallback instead of throwing. */
function parseJson(raw: unknown, fallback: any): any {
  if (typeof raw !== 'string' || raw === '') {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * DocumentModel: this Model represents the content of the file
 */
export class WorkflowModel implements DocumentRegistry.IModel {
  /**
   * Construct a new WorkflowModel.
   *
   * @param options The options used to create a document model.
   */
  constructor(options: DocumentRegistry.IModelOptions<Workflow>) {
    const { collaborationEnabled, sharedModel } = options;
    this._collaborationEnabled = !!collaborationEnabled;
    if (sharedModel) {
      this.sharedModel = sharedModel;
    } else {
      this.sharedModel = Workflow.create();
    }

    // Listening for changes on the shared model to propagate them
    this.sharedModel.changed.connect(this._onSharedModelChanged);
    this.sharedModel.awareness.on('change', this._onClientChanged);
  }

  /**
   * Whether the model is collaborative or not.
   */
  get collaborative(): boolean {
    return this._collaborationEnabled;
  }

  /**
   * The default kernel name of the document.
   *
   * #### Notes
   * Only used if a document has associated kernel.
   */
  readonly defaultKernelName = '';

  /**
   * The default kernel language of the document.
   *
   * #### Notes
   * Only used if a document has associated kernel.
   */
  readonly defaultKernelLanguage = '';

  /**
   * The dirty state of the document.
   *
   * A document is dirty when its content differs from
   * the content saved on disk.
   */
  get dirty(): boolean {
    return this._dirty;
  }
  set dirty(newValue: boolean) {
    const oldValue = this._dirty;
    if (newValue === oldValue) {
      return;
    }
    this._dirty = newValue;
    this.triggerStateChange({
      name: 'dirty',
      oldValue,
      newValue
    });
  }

  /**
   * Whether the model is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * The read only state of the document.
   */
  get readOnly(): boolean {
    return this._readOnly;
  }
  set readOnly(newValue: boolean) {
    if (newValue === this._readOnly) {
      return;
    }
    const oldValue = this._readOnly;
    this._readOnly = newValue;
    this.triggerStateChange({ name: 'readOnly', oldValue, newValue });
  }

  /**
   * The shared document model.
   */
  readonly sharedModel: Workflow = Workflow.create();

  /**
   * The client ID from the document
   *
   * ### Notes
   * Each browser sharing the document will get an unique ID.
   * Its is defined per document not globally.
   */
  get clientId(): number {
    return this.sharedModel.awareness.clientID;
  }

  /**
   * Shared object content
   */
  get chart(): IChart {
    return this.sharedModel.getChart();
  }
  set chart(v: IChart) {
    this.sharedModel.setChart(v);
  }

  /**
   * get the signal clientChanged to listen for changes on the clients sharing
   * the same document.
   *
   * @returns The signal
   */
  get clientChanged(): ISignal<this, Map<number, any>> {
    return this._clientChanged;
  }

  /**
   * A signal emitted when the document content changes.
   *
   * ### Notes
   * The content refers to the data stored in the model
   */
  get contentChanged(): ISignal<this, void> {
    return this._contentChanged;
  }

  /**
   * A signal emitted when the document state changes.
   *
   * ### Notes
   * The state refers to the metadata and attributes of the model.
   */
  get stateChanged(): ISignal<this, IChangedArgs<any>> {
    return this._stateChanged;
  }

  /**
   * Dispose of the resources held by the model.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Should return the data that you need to store in disk as a string.
   * The context will call this method to get the file's content and save it
   * to disk
   *
   * @returns The data
   */
  toString(): string {
    return this.sharedModel.getSource();
  }

  /**
   * The context will call this method when loading data from disk.
   * This method should implement the logic to parse the data and store it
   * on the datastore.
   *
   * @param data Serialized data
   */
  fromString(data: string): void {
    this.sharedModel.setSource(data);
  }

  /**
   * Serialize the model to JSON.
   *
   * #### Notes
   * This method is only used if a document model as format 'json', every other
   * document will load/save the data through toString/fromString.
   */
  toJSON(): PartialJSONValue {
    return JSON.parse(this.toString() || 'null');
  }

  /**
   * Deserialize the model from JSON.
   *
   * #### Notes
   * This method is only used if a document model as format 'json', every other
   * document will load/save the data through toString/fromString.
   */
  fromJSON(value: PartialJSONValue): void {
    this.fromString(JSON.stringify(value));
  }

  /**
   * Initialize the model with its current state.
   */
  initialize(): void {
    return;
  }

  /**
   * Trigger a state change signal.
   */
  protected triggerStateChange(args: IChangedArgs<any>): void {
    this._stateChanged.emit(args);
  }

  /**
   * Trigger a content changed signal.
   */
  protected triggerContentChange(): void {
    this._contentChanged.emit(void 0);
    this.dirty = true;
  }

  /**
   * Callback to listen for changes on the sharedModel. This callback listens
   * to changes on the different clients sharing the document and propagates
   * them to the DocumentWidget.
   */
  private _onClientChanged = () => {
    const clients = this.sharedModel.awareness.getStates();
    this._clientChanged.emit(clients);
  };

  /**
   * Callback to listen for changes on the sharedModel. This callback listens
   * to changes on shared model's content and propagates them to the DocumentWidget.
   *
   * @param sender The sharedModel that triggers the changes.
   * @param changes The changes on the sharedModel.
   */
  private _onSharedModelChanged = (
    sender: Workflow,
    changes: WorkflowChange
  ): void => {
    if (changes.chartChange) {
      this.triggerContentChange();
    }
    if (changes.stateChange) {
      changes.stateChange.forEach(value => {
        if (value.name === 'dirty') {
          // Setting `dirty` will trigger the state change.
          // We always set `dirty` because the shared model state
          // and the local attribute are synchronized one way shared model -> _dirty
          this.dirty = value.newValue;
        } else if (value.oldValue !== value.newValue) {
          this.triggerStateChange({
            newValue: undefined,
            oldValue: undefined,
            ...value
          });
        }
      });
    }
  };

  private _dirty = false;
  private _isDisposed = false;
  private _readOnly = false;
  private _clientChanged = new Signal<this, Map<number, any>>(this);
  private _contentChanged = new Signal<this, void>(this);
  private _collaborationEnabled: boolean;
  private _stateChanged = new Signal<this, IChangedArgs<any>>(this);
}

/**
 * Type representing the changes on the sharedModel.
 *
 * NOTE: Yjs automatically syncs the documents of the different clients
 * and triggers an event to notify that the content changed. You can
 * listen to this changes and propagate them to the widget so you don't
 * need to update all the data in the widget, you can only update the data
 * that changed.
 *
 * This type represents the different changes that may happen and ready to use
 * for the widget.
 */
export type WorkflowChange = {
  chartChange?: boolean;
} & DocumentChange;

/**
 * SharedModel, stores and shares the content between clients.
 */
export class Workflow extends YDocument<WorkflowChange> {
  constructor() {
    super();
    // Creating a new shared object and listen to its changes
    this._content = this.ydoc.getMap('content');
    this._content.observe(this._contentObserver);
  }

  readonly version: string = '1.0.0';

  /**
   * Get the document source
   *
   * @returns The source
   */
  getSource(): string {
    return JSON.stringify({ chart: this.getChart() }, null, 2);
  }

  /**
   * Set the document source
   *
   * @param value The source to set
   */
  setSource(value: string): void {
    let chart: IChart = defaultChart;
    if (value) {
      const obj = parseJson(value, null);
      const raw = obj && typeof obj === 'object' ? obj.chart : null;
      if (raw && typeof raw === 'object') {
        chart = migrateChart(raw);
      }
    }
    this.setChart(chart);
  }

  /**
   * Dispose of the resources.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._content.unobserve(this._contentObserver);
    super.dispose();
  }

  /**
   * Static method to create instances on the sharedModel
   *
   * @returns The sharedModel instance
   */
  static create(): Workflow {
    return new Workflow();
  }

  /**
   * Reassemble the chart from the granular keys, skipping corrupt values so a
   * damaged document still opens. View state comes back at its default.
   */
  getChart(): IChart {
    const nodes: IChart['nodes'] = {};
    const links: IChart['links'] = {};
    // Sorted: Y.Map iteration is hash order, which is neither insertion order
    // nor stable across a rebuild of the document. `getSource` has to be
    // byte-identical to what the server writes for the same content — the room
    // compares the two to decide whether the file is stale — and JSON.stringify
    // emits keys in insertion order, so the sort has to happen here.
    Array.from(this._content.keys())
      .sort()
      .forEach(key => {
        const value = this._content.get(key);
        if (key.startsWith(NODE_KEY_PREFIX)) {
          const node = parseJson(value, null) as INode | null;
          if (node) {
            nodes[key.slice(NODE_KEY_PREFIX.length)] = node;
          }
        } else if (key.startsWith(LINK_KEY_PREFIX)) {
          const link = parseJson(value, null) as ILink | null;
          if (link) {
            links[key.slice(LINK_KEY_PREFIX.length)] = link;
          }
        }
      });
    // Fresh objects throughout: `defaultChart`'s own `properties`, `selected`
    // and `hovered` would otherwise be handed to every caller, and the composer
    // assigns into `properties.params` in place (see `onDeleteKey`).
    const stored = parseJson(this._content.get(PROPERTIES_KEY), null);
    const chart: IChart = {
      ...defaultChart,
      offset: { ...defaultChart.offset },
      nodes,
      links,
      properties: {
        ...stored,
        params: Array.isArray(stored?.params) ? stored.params : []
      },
      selected: {},
      hovered: {}
    };
    const metadata = parseJson(this._content.get(METADATA_KEY), null);
    if (metadata) {
      (chart as Record<string, any>).metadata = metadata;
    }
    return chart;
  }

  /**
   * Write only the keys that changed, deleting those of removed elements, so
   * concurrent edits merge rather than overwrite. A no-op write emits nothing.
   */
  setChart(chart: IChart): void {
    const desired = new Map<string, string>();
    Object.entries(chart.nodes ?? {}).forEach(([id, node]) => {
      desired.set(NODE_KEY_PREFIX + id, JSON.stringify(node));
    });
    Object.entries(chart.links ?? {}).forEach(([id, link]) => {
      desired.set(LINK_KEY_PREFIX + id, JSON.stringify(link));
    });
    desired.set(
      PROPERTIES_KEY,
      JSON.stringify(chart.properties ?? defaultChart.properties)
    );
    const metadata = (chart as Record<string, any>).metadata;
    if (metadata) {
      desired.set(METADATA_KEY, JSON.stringify(metadata));
    }
    this.transact(() => {
      Array.from(this._content.keys()).forEach(key => {
        if (!desired.has(key)) {
          this._content.delete(key);
        }
      });
      desired.forEach((json, key) => {
        if (this._content.get(key) !== json) {
          this._content.set(key, json);
        }
      });
    });
  }

  /**
   * Handle a change.
   *
   * @param event Model event
   */
  private _contentObserver = (event: Y.YMapEvent<any>): void => {
    if (event.keysChanged.size === 0) {
      return;
    }
    this._changed.emit({ chartChange: true });
  };

  private _content: Y.Map<any>;
}
