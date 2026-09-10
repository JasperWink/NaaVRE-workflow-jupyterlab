import React, { CSSProperties, ForwardedRef, useContext } from 'react';
import styled from 'styled-components';
import { INodeDefaultProps } from '@mrblenny/react-flow-chart';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import { TooltipOverflowLabel } from '../common/TooltipOverflowLabel';
import { isSpecialNodeType } from '../../utils/specialCells';
import { INode } from '../../utils/chart';
import { ICollaborator, readableTextColor } from '../../utils/presence';
import { NodePresenceContext } from './NodePresenceContext';

const DROP_SHADOW = 'rgba(0, 0, 0, 0.1) 0 7px 10px 0';

/** The node outline: a collaborator's colour wins, then the draft dashes. */
function nodeBorder(presenceColor?: string, isDraft?: boolean): string {
  if (presenceColor) {
    return `1px solid ${presenceColor}`;
  }
  return isDraft ? '1px dashed darkgray' : '1px solid lightgray';
}

/**
 * A collaborator's ring on three edges, leaving `openEdge` — the one shared
 * with the other half of the node — to be drawn there. Inset, because the title
 * bar sits outside this box: an outline would ring only the body, and either an
 * outline or a thicker border would shift the layout.
 */
function presenceRing(color: string, openEdge: 'top' | 'bottom'): string {
  const closed = openEdge === 'top' ? '0 -2px' : '0 2px';
  return `inset ${closed} 0 0 ${color},
     inset 2px 0 0 0 ${color},
     inset -2px 0 0 0 ${color}`;
}

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
  border: ${props => nodeBorder(props.presenceColor, props.isDraft)};
  border-top-width: 0;
  box-shadow: ${props =>
    props.presenceColor
      ? `${presenceRing(props.presenceColor, 'top')}, ${DROP_SHADOW}`
      : DROP_SHADOW};
`;

/**
 * Name flags for collaborators on this node, stacked above its title bar.
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
        border: nodeBorder(presenceColor, cell.is_draft),
        borderBottomWidth: 0,
        boxShadow: presenceColor
          ? presenceRing(presenceColor, 'bottom')
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

export const NodeCustom = React.forwardRef(
  (
    { node, children, ...otherProps }: INodeDefaultProps & { node: INode },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    // Via context, not props: a new component type remounts every node.
    const presence = useContext(NodePresenceContext);
    const collaborators = presence[node.id] ?? [];

    const isSpecialNode = isSpecialNodeType(node.type);
    // With several collaborators on one node, the first one's colour carries
    // the outline; the flags name all of them.
    const presenceColor = collaborators[0]?.color;

    return (
      <NodeContainer
        width={isSpecialNode ? '200px' : '250px'}
        height={getNodeHeight(node)}
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
);
NodeCustom.displayName = 'NodeCustom';
