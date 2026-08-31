import React, { CSSProperties, ForwardedRef, useContext } from 'react';
import styled from 'styled-components';
import { INodeDefaultProps } from '@mrblenny/react-flow-chart';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import { TooltipOverflowLabel } from '../common/TooltipOverflowLabel';
import { DRAFT_CELL_TYPE } from '../../utils/specialCells';
import { INode } from '../../utils/chart';
import { ICollaborator, readableTextColor } from '../../utils/presence';
import { NodePresenceContext } from './NodePresenceContext';

const NodeContainer = styled.div<{
  width?: string;
  height?: string;
  isDraft?: boolean;
  presenceColor?: string;
}>`
  position: absolute;
  background: white;
  width: ${props => props.width || '250px'};
  height: ${props => props.height || '150px'};
  min-height: 60px;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  border: ${props =>
    props.presenceColor
      ? `1px solid ${props.presenceColor}`
      : props.isDraft
        ? '1px dashed darkgray'
        : '1px solid lightgray'};
  border-top-width: 0;
  /* The title bar is positioned above this box, so an outline here would ring
     only the body. The two elements' borders already trace the combined
     silhouette, so the collaborator's colour is drawn as an inset ring on the
     three outer edges of each — no seam where they meet, and no layout shift,
     which an outline or a thicker border would both cause. */
  box-shadow: ${props =>
    props.presenceColor
      ? `inset 0 -2px 0 0 ${props.presenceColor},
         inset 2px 0 0 0 ${props.presenceColor},
         inset -2px 0 0 0 ${props.presenceColor},
         rgba(0, 0, 0, 0.1) 0 7px 10px 0`
      : 'rgba(0, 0, 0, 0.1) 0 7px 10px 0'};
`;

/**
 * Name flags for the collaborators currently on this node, stacked above the
 * node's title bar. Rendered inside NodeTitle so they sit directly on top of
 * it whatever height the title turns out to be.
 */
function CollaboratorFlags({
  collaborators
}: {
  collaborators: Array<ICollaborator>;
}) {
  if (collaborators.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '-1px',
        display: 'flex',
        gap: '4px',
        paddingBottom: '3px',
        // The flags are an indicator, not a target: clicks belong to the node.
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {collaborators.map(collaborator => (
        <span
          key={collaborator.clientId}
          style={{
            backgroundColor: collaborator.color,
            color: readableTextColor(collaborator.color),
            fontSize: '11px',
            lineHeight: '1.6',
            padding: '1px 6px',
            borderRadius: '3px 3px 3px 0',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0 1px 3px 0'
          }}
        >
          {collaborator.name}
        </span>
      ))}
    </div>
  );
}

function NodeTitle({
  cell,
  isSpecialNode,
  backgroundColor,
  collaborators
}: {
  cell: ICell;
  isSpecialNode: boolean;
  backgroundColor: CSSProperties['color'];
  collaborators: Array<ICollaborator>;
}) {
  const regex = new RegExp(`-${cell.owner}$`);
  const title = cell.title.replace(regex, '');
  const presenceColor = collaborators[0]?.color;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '-1px',
        width: '100%',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
        border: presenceColor
          ? `1px solid ${presenceColor}`
          : cell.is_draft
            ? '1px dashed darkgray'
            : '1px solid lightgray',
        borderBottomWidth: 0,
        // Top, left and right only: the bottom edge is shared with the node
        // body, which draws the other three. Together they ring the whole node.
        boxShadow: presenceColor
          ? `inset 0 2px 0 0 ${presenceColor},
             inset 2px 0 0 0 ${presenceColor},
             inset -2px 0 0 0 ${presenceColor}`
          : undefined,
        backgroundColor: backgroundColor,
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <CollaboratorFlags collaborators={collaborators} />
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
  ref: ForwardedRef<HTMLDivElement>,
  collaborators: Array<ICollaborator>
) {
  // Draft nodes are not catalogue cells, but they carry user-defined
  // inputs/outputs and should render like (draft) workflow-cells rather than the
  // fixed-size Splitter/Merger "special" nodes.
  const isDraftCell = node.type === DRAFT_CELL_TYPE;
  const isSpecialNode = node.type !== 'workflow-cell' && !isDraftCell;

  getNodeHeight(node);
  const width = isSpecialNode ? '200px' : '250px';
  const height = getNodeHeight(node);
  // With several collaborators on one node, the first one's colour carries the
  // outline; the flags name all of them.
  const presenceColor = collaborators[0]?.color;

  return (
    <NodeContainer
      width={width}
      height={height}
      isDraft={node.properties.cell.is_draft}
      presenceColor={presenceColor}
      ref={ref}
      {...otherProps}
    >
      <NodeTitle
        cell={node.properties.cell}
        collaborators={collaborators}
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
    // Read from context rather than props: react-flow-chart renders
    // `Components.Node` with a fixed prop set, and swapping the component out
    // to inject presence would remount every node. See NodePresenceContext.
    const presence = useContext(NodePresenceContext);
    return NodeCustomElement(
      { node, children, ...otherProps },
      ref,
      presence[node.id] ?? []
    );
  }
);
NodeCustom.displayName = 'NodeCustom';
