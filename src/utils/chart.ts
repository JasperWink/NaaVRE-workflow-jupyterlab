import ColorHash from 'color-hash';
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
