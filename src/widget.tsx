// Derived from https://github.com/jupyterlab/extension-examples/blob/2b9283f611d2471f8ac310704a3c6a896cbc1e07/documents/src/widget.tsx
// Copyright 2023 Project Jupyter Contributors; licensed under the BSD 3-Clause License license:
// https://github.com/jupyterlab/extension-examples/blob/main/LICENSE
//
// Original version has copyright 2018 Wolf Vollprecht and is licensed
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';

import { Message } from '@lumino/messaging';

import { Signal } from '@lumino/signaling';

import { WorkflowModel } from './model';

import { ReactWidget } from '@jupyterlab/apputils';
import lodash from 'lodash';
import { Composer } from './components/Composer';
import React from 'react';
import { ISettings, SettingsContext } from './settings';
import {
  ChartContent,
  IChart,
  IChartParam,
  mergeChartChanges,
  mergeChartParams
} from './utils/chart';
import { migrateChart } from './utils/chartMigrations';
import {
  collectNodePresence,
  INodePresence,
  IWorkflowSelection,
  SELECTION_FIELD
} from './utils/presence';

/**
 * DocumentWidget: widget that represents the view or editor for a file type.
 */
export class WorkflowWidget extends DocumentWidget<
  ExperimentManagerWidget,
  WorkflowModel
> {
  constructor(
    options: DocumentWidget.IOptions<ExperimentManagerWidget, WorkflowModel>
  ) {
    super(options);
  }

  updateSettings(settings: Partial<ISettings>) {
    this.content.updateSettings(settings);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this.content.dispose();
    super.dispose();
  }
}

/**
 * Widget that contains the main view of the DocumentWidget.
 */
export class ExperimentManagerWidget extends ReactWidget {
  composerRef: React.RefObject<Composer>;
  settings: ISettings = {};
  private _model: WorkflowModel;

  /**
   * What this client last took from the shared model. Local edits are diffed
   * against it so a flush carries this user's changes and nothing else.
   */
  private _base: ChartContent = { nodes: {}, links: {} };

  /** The chart-level params half of `_base`; merged by the same rule. */
  private _baseParams: Array<IChartParam> = [];

  /**
   * Set while this client is writing to the shared model, so the change signal
   * its own write raises is not treated as news from a collaborator.
   */
  private _writing = false;

  /**
   * Collaborators by node id, as last handed to the composer, so awareness
   * updates that change nothing drawn cost nothing.
   */
  private _presence: INodePresence = {};

  /**
   * Construct a `ExperimentManagerWidget`.
   *
   * @param context - The document's context.
   */
  constructor(context: DocumentRegistry.IContext<WorkflowModel>) {
    super();
    this.addClass('vre-composer');
    this.composerRef = React.createRef();

    this._model = context.model;

    context.ready.then(value => {
      // Before the signals are connected and before `_base` is seeded, so the
      // migration is never mistaken for a local edit.
      this._migrateChartIfNeeded();

      this._model.contentChanged.connect(this._onContentChanged);
      this._model.clientChanged.connect(this._onClientChanged);

      this._onContentChanged();
      // Clients already in the document have their awareness state; the
      // signal only reports changes from here on.
      this._applyPresence(this._model.sharedModel.awareness.getStates());

      this.update();
    });

    this._onContentChanged();
  }

  updateSettings(settings: Partial<ISettings>) {
    this.settings = { ...this.settings, ...settings };
    this.update();
  }

  /**
   * Bring the loaded chart up to the current version, once. `setSource` never
   * runs under collaboration - the server loads the file - so migrating here
   * covers both modes. Idempotent, so two clients racing still converge.
   */
  private _migrateChartIfNeeded(): void {
    const chart = this._model.chart;
    const migrated = migrateChart(chart);
    if (!lodash.isEqual(migrated, chart)) {
      this._model.chart = migrated;
    }
  }

  render() {
    return (
      <SettingsContext.Provider value={this.settings}>
        <Composer
          ref={this.composerRef}
          onChartChange={this._onComposerChartChange}
          onSelectionChange={this._onComposerSelectionChange}
        />
      </SettingsContext.Provider>
    );
  }

  /**
   * Push local edits into the shared model, debounced so drags coalesce. Read
   * at flush time, not from the reported argument: a repaint inside the window
   * moves `_base` on, and a stale snapshot would read as a deletion.
   */
  private _onComposerChartChange = lodash.debounce((): void => {
    this._syncDocumentToModel(this.composerRef.current?.state.chart);
  }, 50);

  /**
   * Publish the node this user has open on the awareness channel, which never
   * touches the CRDT. It makes collisions visible, it does not prevent them.
   */
  private _onComposerSelectionChange = (
    selection: IWorkflowSelection
  ): void => {
    this._model.sharedModel.awareness.setLocalStateField(
      SELECTION_FIELD,
      selection
    );
  };

  /** Handle an awareness change from any client sharing this document. */
  private _onClientChanged = (
    sender: WorkflowModel,
    clients: Map<number, any>
  ): void => {
    this._applyPresence(clients);
  };

  /** Recompute who is on which node, skipping the update when unchanged. */
  private _applyPresence(clients: Map<number, any>): void {
    const presence = collectNodePresence(clients, this._model.clientId);
    if (lodash.isEqual(presence, this._presence)) {
      return;
    }
    this._presence = presence;
    this.composerRef.current?.setNodePresence(presence);
  }

  /**
   * Write this client's *changes* into the shared model. `chart` is a snapshot,
   * so diffing against `_base` keeps a collaborator's concurrent additions.
   */
  private _syncDocumentToModel(chart: IChart | null | undefined): void {
    if (!chart) {
      return;
    }
    const current = this._model.chart;
    const merged = mergeChartChanges(this._base, chart, current);
    // Params get the same treatment as nodes and links rather than a whole
    // array write, which would drop a collaborator's concurrent param edit.
    const localParams = chart.properties?.params;
    const params =
      localParams === undefined
        ? current.properties.params
        : mergeChartParams(
            this._baseParams,
            localParams,
            current.properties.params
          );
    if (
      !lodash.isEqual(current.nodes, merged.nodes) ||
      !lodash.isEqual(current.links, merged.links) ||
      !lodash.isEqual(current.properties.params, params)
    ) {
      this._writing = true;
      try {
        this._model.chart = {
          ...current,
          nodes: merged.nodes,
          links: merged.links,
          properties: { ...current.properties, params }
        };
      } finally {
        this._writing = false;
      }
    }
    this._base = lodash.cloneDeep(merged);
    this._baseParams = lodash.cloneDeep(params);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._onComposerChartChange.cancel();
    this._model.contentChanged.disconnect(this._onContentChanged);
    this._model.clientChanged.disconnect(this._onClientChanged);
    if (!this._model.isDisposed) {
      // Drop this client's flag rather than leaving other clients to wait for
      // the awareness state to time out.
      this._model.sharedModel.awareness.setLocalStateField(
        SELECTION_FIELD,
        null
      );
    }
    Signal.clearData(this);
    super.dispose();
  }

  /**
   * Handle `after-attach` messages sent to the widget.
   *
   * @param msg Widget layout message
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('focusout', this, true);
  }

  /**
   * Handle `before-detach` messages sent to the widget.
   *
   * @param msg Widget layout message
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('focusout', this, true);
    super.onBeforeDetach(msg);
  }

  /**
   * Handle event messages sent to the widget.
   *
   * @param event Event on the widget
   */
  handleEvent(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.type) {
      switch (event.type) {
        case 'focusout':
          this._syncDocumentToModel(this.composerRef.current?.state.chart);
          break;
      }
    }
  }

  /**
   * Callback to listen for changes on the model. This callback listens
   * to changes on shared model's content.
   */
  private _onContentChanged = (): void => {
    if (this._writing) {
      // Our own write. The composer already holds what we just sent, and
      // `_syncDocumentToModel` moves `_base` on once it returns.
      return;
    }
    const shared = this._model.chart;
    const local = this.composerRef.current?.state.chart ?? null;
    // Replay this client's un-flushed edits on top of the incoming snapshot,
    // by the same rule the flush uses. Taking the snapshot wholesale would drop
    // whatever the user did since the last flush - up to a whole drag, since
    // the debounce only settles once the drag stops.
    const content = local
      ? mergeChartChanges(this._base, local, shared)
      : { nodes: shared.nodes, links: shared.links };
    const localParams = local?.properties?.params;
    const params =
      localParams === undefined
        ? shared.properties.params
        : mergeChartParams(
            this._baseParams,
            localParams,
            shared.properties.params
          );
    this._base = lodash.cloneDeep({
      nodes: shared.nodes,
      links: shared.links
    });
    this._baseParams = lodash.cloneDeep(shared.properties.params);
    this.composerRef.current?.setState({
      chart: {
        nodes: content.nodes,
        links: content.links,
        properties: { ...shared.properties, params },
        offset: local?.offset ?? shared.offset,
        scale: local?.scale ?? shared.scale,
        // Pruned against what is actually drawn, not against `shared`: a node
        // this client just added is selectable before it reaches the document.
        selected: this._pruneDeletedRef(local?.selected ?? {}, content),
        hovered: this._pruneDeletedRef(local?.hovered ?? {}, content)
      }
    });
  };

  /** The given selection/hover, or empty if another client deleted its target. */
  private _pruneDeletedRef(
    ref: IChart['selected'],
    chart: ChartContent
  ): IChart['selected'] {
    if (
      (ref.type === 'node' && ref.id && !(ref.id in chart.nodes)) ||
      (ref.type === 'link' && ref.id && !(ref.id in chart.links))
    ) {
      return {};
    }
    return ref;
  }
}
