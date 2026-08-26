import React, { useContext, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SxProps } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShareIcon from '@mui/icons-material/Share';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { ISpecialCell } from '../../utils/specialCells';
import { cellToChartNode } from '../../utils/chart';
import Box from '@mui/material/Box';
import { CellShareDialog } from './CellShareDialog';
import { UserInfoContext } from './UserInfoContext';
import { TooltipOverflowLabel } from '../common/TooltipOverflowLabel';

function CellTitle({
  cell,
  isSpecialNode,
  userIsOwner,
  sx
}: {
  cell: ICell | ISpecialCell;
  isSpecialNode: boolean;
  userIsOwner: boolean;
  sx?: SxProps;
}) {
  const regex = new RegExp(`-${cell.owner}$`);
  const title = cell.title.replace(regex, '');

  return (
    <Stack sx={sx}>
      <TooltipOverflowLabel variant="subtitle2" label={title} />
      {isSpecialNode || (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center'
          }}
        >
          {cell.is_draft && (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              draft
            </Typography>
          )}
          <LocalOfferIcon color="action" fontSize="inherit" />
          <Typography variant="body2">v{cell.version}</Typography>
          {cell.owner && (
            <>
              <PersonIcon color="action" fontSize="inherit" />
              <TooltipOverflowLabel
                variant="body2"
                label={userIsOwner ? 'me' : cell.owner}
              />
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}

export function CellNode({
  cell,
  selectedCellInList,
  setSelectedCell,
  fetchCellsListResponse
}: {
  cell: ICell | ISpecialCell;
  selectedCellInList: ICell | null;
  setSelectedCell: (c: ICell | null, n: HTMLDivElement | null) => void;
  fetchCellsListResponse: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const node = cellToChartNode(cell);
  const isSpecialNode = node.type !== 'workflow-cell';

  const userinfo = useContext(UserInfoContext);
  const userIsOwner = cell.owner === userinfo.preferred_username;

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  function onInfoButtonClick() {
    selectedCellInList === cell
      ? setSelectedCell(null, null)
      : setSelectedCell(cell, ref.current || null);
  }

  return (
    <Box
      ref={ref}
      draggable={true}
      onDragStart={(event: any) => {
        event.dataTransfer.setData(
          REACT_FLOW_CHART,
          JSON.stringify({
            type: node.type,
            ports: node.ports,
            properties: node.properties
          })
        );
      }}
      sx={{
        margin: '10px',
        fontSize: '14px',
        display: 'flex',
        height: '25px',
        border: cell.is_draft ? '1px dashed darkgray' : '1px solid lightgray',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgb(195, 235, 202)',
        backgroundColor: isSpecialNode
          ? 'rgb(195, 235, 202)'
          : cell.is_draft
            ? 'rgb(240,240,240)'
            : 'rgb(229,252,233)',
        borderRadius: '5px',
        padding: '10px',
        paddingRight: '1px',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing'
        }
      }}
    >
      <CellTitle
        cell={cell}
        isSpecialNode={isSpecialNode}
        userIsOwner={userIsOwner}
        sx={{ width: 'calc(100% - 80px + 8px)' }}
      />
      {isSpecialNode || (
        <>
          <IconButton
            aria-label="Info"
            style={{ borderRadius: '100%' }}
            sx={{ width: '40px' }}
            onClick={() => setShareDialogOpen(true)}
          >
            {(cell.shared_with_users || []).length > 0 ||
            (cell.shared_with_scopes || []).length > 0 ? (
              <PeopleIcon />
            ) : (
              <ShareIcon />
            )}
          </IconButton>
          <CellShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            onUpdated={fetchCellsListResponse}
            cell={cell}
            readonly={!userIsOwner}
          />
        </>
      )}
      <IconButton
        aria-label="Info"
        style={{ borderRadius: '100%' }}
        sx={{ width: '40px', marginLeft: '-8px' }}
        onClick={onInfoButtonClick}
      >
        <InfoOutlinedIcon />
      </IconButton>
    </Box>
  );
}

export function LoadingCellNode() {
  return (
    <Skeleton
      variant="rounded"
      style={{
        margin: '10px',
        fontSize: '14px',
        display: 'flex',
        height: '25px',
        border: '1px solid transparent',
        padding: '10px',
        borderRadius: '5px'
      }}
    />
  );
}
