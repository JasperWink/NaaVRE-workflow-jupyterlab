import ColorHash from 'color-hash';
import * as lodash from 'lodash';
import {
  IChart as IChartRFC,
  INode as INodeRFC,
  IOnLinkCompleteInput
} from '@mrblenny/react-flow-chart';

import {
  ICell,
  VariableType
} from '../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { ISpecialCell } from './specialCells';

/** The part of a chart that is document content, as opposed to view state. */
export type ChartContent = Pick<IChart, 'nodes' | 'links'>;

export interface IChartParam {
  node_id: string;
  name: string;
  value?: string;
  type?: VariableType;
  helpText?: string;
  noValueText?: string;
}

export interface INodeProps {
  cell: ICell;
}

export interface IChartProps {
  params: Array<IChartParam>;
}

export interface INode extends INodeRFC<INodeProps> {}
export interface IChart extends IChartRFC<IChartProps, INodeProps> {}

/**
 * Apply one collection's local changes on top of the shared one.
 *
 * `base` is what this client last took from the shared document, `local` is
 * what it holds now, and `remote` is where the shared document has got to.
 * Entries the local user added or edited are applied on top of `remote`;
 * entries they removed are removed from it. An entry missing from `local` that
 * `base` never held belongs to another client and is left alone.
 */
function mergeCollection<T>(
  base: Record<string, T>,
  local: Record<string, T>,
  remote: Record<string, T>
): Record<string, T> {
  const merged: Record<string, T> = { ...remote };
  for (const [id, value] of Object.entries(local)) {
    if (!lodash.isEqual(value, base[id])) {
      merged[id] = value;
    }
  }
  for (const id of Object.keys(base)) {
    if (!(id in local)) {
      delete merged[id];
    }
  }
  return merged;
}

/**
 * Merge a client's local chart content into the shared content, sending what
 * that client changed rather than everything it happens to hold.
 *
 * Writing a whole snapshot instead loses data: setChart (src/model.ts) deletes
 * keys the snapshot does not mention, so a node a collaborator added while a
 * local edit was pending would be deleted by the next flush, on every client.
 */
export function mergeChartChanges(
  base: ChartContent,
  local: ChartContent,
  remote: ChartContent
): ChartContent {
  return {
    nodes: mergeCollection(base.nodes, local.nodes, remote.nodes),
    links: mergeCollection(base.links, local.links, remote.links)
  };
}

export const defaultChart: IChart = {
  offset: {
    x: 0,
    y: 0
  },
  scale: 1,
  nodes: {},
  links: {},
  properties: {
    params: []
  },
  selected: {},
  hovered: {}
};

export function getVariableColor(name: string) {
  const colorHash = new ColorHash();
  return colorHash.hex(name);
}

export function cellToChartNode(cell: ICell | ISpecialCell): INode {
  const type = 'type' in cell ? cell.type : 'workflow-cell';

  return {
    id: cell.url,
    type: type,
    position: { x: 35, y: 15 },
    properties: {
      cell: cell
    },
    ports: Object.fromEntries([
      ...cell.inputs.map(v => {
        return [
          v.name,
          {
            id: v.name,
            type: 'left',
            properties: {
              color: getVariableColor(v.name),
              parentNodeType: type
            }
          }
        ];
      }),
      ...cell.outputs.map(v => {
        return [
          v.name,
          {
            id: v.name,
            type: 'right',
            properties: {
              color: getVariableColor(v.name),
              parentNodeType: type
            }
          }
        ];
      })
    ])
  };
}

export function validateLink(props: IOnLinkCompleteInput): boolean {
  const { fromNodeId, toNodeId } = props;
  // no links between same node
  if (fromNodeId === toNodeId) {
    return false;
  }
  return true;
}

export function getChartParam(
  chart: IChart | null,
  ChartParam: IChartParam
): string | undefined {
  if (chart === null) {
    return undefined;
  }
  const param = chart.properties.params.find(p => {
    return p.node_id === ChartParam.node_id && p.name === ChartParam.name;
  });
  return param?.value;
}

export function setChartParam(chart: IChart, chartParam: IChartParam): IChart {
  const { node_id, name, value } = chartParam;
  if (value === undefined) {
    console.warn(
      `Cannot set NodeParam with undefined value: ${JSON.stringify(chartParam)}`
    );
    return chart;
  }

  const isParamInChartProperties =
    getChartParam(chart, chartParam) !== undefined;
  let updatedParams: Array<IChartParam>;
  if (isParamInChartProperties) {
    if (value === '') {
      // remove from the params list
      updatedParams = chart.properties.params.filter(
        p => !(p.node_id === chartParam.node_id && p.name === chartParam.name)
      );
    } else {
      // update the value in the params list
      updatedParams = chart.properties.params.map(p =>
        p.node_id === chartParam.node_id && p.name === chartParam.name
          ? { ...p, value }
          : p
      );
    }
  } else {
    updatedParams = [...chart.properties.params, { node_id, name, value }];
  }

  return {
    ...chart,
    properties: {
      params: updatedParams
    }
  };
}

// Add a cell as a new node to the chart. Used when a node is created
// programmatically (e.g. a draft node from a dialog) rather than dropped from
// the sidebar. The node is positioned near the top-left of the currently
// visible canvas, with a small per-node offset so successive nodes don't fully
// overlap, and is selected so the element editor opens for it.
export function addCellNodeToChart(
  chart: IChart,
  cell: ICell | ISpecialCell
): IChart {
  const node = cellToChartNode(cell);
  const n = Object.keys(chart.nodes).length;
  node.position = {
    x: -chart.offset.x + 80 + (n % 6) * 30,
    y: -chart.offset.y + 80 + (n % 6) * 30
  };
  return {
    ...chart,
    nodes: {
      ...chart.nodes,
      [node.id]: node
    },
    selected: { type: 'node', id: node.id }
  };
}

// Replace the cell backing an existing node (e.g. after editing a draft node's
// inputs/outputs). Ports are recomputed from the new cell while the node keeps
// its id and position. Any link referencing a port that no longer exists on
// this node is dropped.
export function updateChartNodeCell(
  chart: IChart,
  nodeId: string,
  cell: ICell | ISpecialCell
): IChart {
  const existing = chart.nodes[nodeId];
  if (!existing) {
    return chart;
  }
  const newNode = cellToChartNode(cell);
  newNode.id = nodeId;
  newNode.position = existing.position;

  const validPorts = new Set(Object.keys(newNode.ports));
  const links = Object.fromEntries(
    Object.entries(chart.links).filter(([, link]) => {
      if (link.from.nodeId === nodeId && !validPorts.has(link.from.portId)) {
        return false;
      }
      if (
        link.to.nodeId === nodeId &&
        link.to.portId !== undefined &&
        !validPorts.has(link.to.portId)
      ) {
        return false;
      }
      return true;
    })
  );

  return {
    ...chart,
    nodes: {
      ...chart.nodes,
      [nodeId]: newNode
    },
    links
  };
}
