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
import { ChartContent, IChart, mergeChartChanges } from './utils/chart';
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
   * The document content this client last took from the shared model, i.e.
   * what the composer's chart is a modification *of*. Local edits are diffed
   * against it so a flush carries this user's changes and nothing else.
   */
  private _base: ChartContent = { nodes: {}, links: {} };

  /**
   * Remote collaborators by node id, as last handed to the composer. Kept so
   * awareness updates that do not change what is drawn cost nothing: awareness
   * fires far more often than the picture changes.
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
   * Push local chart edits into the shared model, debounced so that rapid
   * changes (dragging a node) coalesce into one write.
   */
  private _onComposerChartChange = lodash.debounce((chart: IChart): void => {
    this._syncDocumentToModel(chart);
  }, 50);

  /**
   * Publish the node this user has open on the awareness channel.
   *
   * Awareness is not document content — it is never written to the shared map
   * and never saved — so this does not touch the CRDT or make the document
   * dirty. It also does not prevent two clients editing one node; it makes
   * that situation visible so they can avoid it.
   */
  private _onComposerSelectionChange = (
    selection: IWorkflowSelection
  ): void => {
    this._model.sharedModel.awareness.setLocalStateField(
      SELECTION_FIELD,
      selection
    );
  };

  /**
   * Handle an awareness change from any client sharing this document.
   */
  private _onClientChanged = (
    sender: WorkflowModel,
    clients: Map<number, any>
  ): void => {
    this._applyPresence(clients);
  };

  /**
   * Recompute who is on which node and pass it to the composer, skipping the
   * update when the result is unchanged.
   */
  private _applyPresence(clients: Map<number, any>): void {
    const presence = collectNodePresence(clients, this._model.clientId);
    if (lodash.isEqual(presence, this._presence)) {
      return;
    }
    this._presence = presence;
    this.composerRef.current?.setNodePresence(presence);
  }

  /**
   * Write this client's *changes* to document content into the shared model.
   *
   * `chart` is a snapshot from when the user last touched the canvas, so the
   * shared document may have moved on since. Diffing against `_base` keeps a
   * collaborator's concurrent addition instead of deleting it as missing.
   * View state (offset, scale, selected, hovered) is per-client and never
   * written.
   */
  private _syncDocumentToModel(chart: IChart | null | undefined): void {
    if (!chart) {
      return;
    }
    const current = this._model.chart;
    const merged = mergeChartChanges(this._base, chart, current);
    const properties = chart.properties ?? current.properties;
    if (
      !lodash.isEqual(current.nodes, merged.nodes) ||
      !lodash.isEqual(current.links, merged.links) ||
      !lodash.isEqual(current.properties, properties)
    ) {
      this._model.chart = {
        ...current,
        nodes: merged.nodes,
        links: merged.links,
        properties
      };
    }
    this._base = lodash.cloneDeep(merged);
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
    const shared = this._model.chart;
    this._base = lodash.cloneDeep({
      nodes: shared.nodes,
      links: shared.links
    });
    const local = this.composerRef.current?.state.chart ?? null;
    this.composerRef.current?.setState({
      chart: {
        nodes: shared.nodes,
        links: shared.links,
        properties: shared.properties,
        offset: local?.offset ?? shared.offset,
        scale: local?.scale ?? shared.scale,
        selected: this._pruneDeletedRef(local?.selected ?? {}, shared),
        hovered: this._pruneDeletedRef(local?.hovered ?? {}, shared)
      }
    });
  };

  /**
   * Return the given selection/hover reference, or an empty one if it points
   * at a node or link another client has since deleted.
   */
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
