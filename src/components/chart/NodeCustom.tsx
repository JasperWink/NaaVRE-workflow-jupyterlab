import React, { CSSProperties, ForwardedRef } from 'react';
import styled from 'styled-components';
import { INodeDefaultProps } from '@mrblenny/react-flow-chart';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import { TooltipOverflowLabel } from '../common/TooltipOverflowLabel';
import { INode } from '../../utils/chart';

const NodeContainer = styled.div<{
  width?: string;
  height?: string;
  isDraft?: boolean;
}>`
  position: absolute;
  background: white;
  width: ${props => props.width || '250px'};
  height: ${props => props.height || '150px'};
  min-height: 60px;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  border: ${props =>
    props.isDraft ? '1px dashed darkgray' : '1px solid lightgray'};
  border-top-width: 0;
  box-shadow: rgba(0, 0, 0, 0.1) 0 7px 10px 0;
`;

function NodeTitle({
  cell,
  isSpecialNode,
  backgroundColor
}: {
  cell: ICell;
  isSpecialNode: boolean;
  backgroundColor: CSSProperties['color'];
}) {
  const regex = new RegExp(`-${cell.owner}$`);
  const title = cell.title.replace(regex, '');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '-1px',
        width: '100%',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
        border: cell.is_draft ? '1px dashed darkgray' : '1px solid lightgray',
        borderBottomWidth: 0,
        backgroundColor: backgroundColor,
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          padding: '10px',
          width: 'calc(100% - 60px + 8px)',
          alignItems: 'center',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing'
          }
        }}
      >
        <TooltipOverflowLabel variant="subtitle2" label={title} />
        {cell.is_draft && (
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            draft
          </Typography>
        )}
        {isSpecialNode || (
          <Typography variant="body2">v{cell.version}</Typography>
        )}
      </Stack>
      <IconButton
        aria-label="Info"
        style={{ borderRadius: '100%' }}
        sx={{ width: '40px', marginLeft: '-8px' }}
      >
        <InfoOutlinedIcon />
      </IconButton>
    </div>
  );
}

function getNodeHeight(node: INode) {
  const maxPortsCount = Math.max(
    Object.values(node.ports).filter(p => p.type === 'left').length,
    Object.values(node.ports).filter(p => p.type === 'right').length
  );
  const portHeightPx = 26;
  const heightPx = maxPortsCount * (portHeightPx || 1);
  return `${heightPx}px`;
}

function NodeCustomElement(
  { node, children, ...otherProps }: INodeDefaultProps & { node: INode },
  ref: ForwardedRef<HTMLDivElement>
) {
  const isSpecialNode = node.type !== 'workflow-cell';

  getNodeHeight(node);
  const width = isSpecialNode ? '200px' : '250px';
  const height = getNodeHeight(node);

  return (
    <NodeContainer
      width={width}
      height={height}
      isDraft={node.properties.cell.is_draft}
      ref={ref}
      {...otherProps}
    >
      <NodeTitle
        cell={node.properties.cell}
        isSpecialNode={isSpecialNode}
        backgroundColor={
          isSpecialNode
            ? 'rgb(195, 235, 202)'
            : node.properties.cell.is_draft
              ? 'rgb(240,240,240)'
              : 'rgb(229,252,233)'
        }
      />
      {children}
    </NodeContainer>
  );
}

export const NodeCustom = React.forwardRef(
  (
    { node, children, ...otherProps }: INodeDefaultProps & { node: INode },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    return NodeCustomElement({ node, children, ...otherProps }, ref);
  }
);
