import React, { useContext, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import {
  ISpecialCell,
  makeDraftCell,
  specialCells
} from '../../utils/specialCells';
import { CellsList } from './CellsList';
import { DraftCellDialog } from './DraftCellDialog';
import { PageNav } from './PageNav';
import { ListFilter } from './ListFilter';
import { SettingsContext } from '../../settings';
import { useCatalogueList } from '../../hooks/use-catalogue-list';
import { ISharingScope } from '../../naavre-common/types/NaaVRECatalogue/BaseAssets';
import { SharingScopesContext } from './SharingScopesContext';
import { useUserInfo } from '../../hooks/use-user-info';
import { UserInfoContext } from './UserInfoContext';

export function CellsSideBar({
  selectedCellInList,
  setSelectedCell,
  onCreateDraftCell
}: {
  selectedCellInList: ICell | null;
  setSelectedCell: (c: ICell | null, n: HTMLDivElement | null) => void;
  onCreateDraftCell: (cell: ISpecialCell) => void;
}) {
  const settings = useContext(SettingsContext);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const {
    setUrl: setCellsListUrl,
    loading,
    errorMessage,
    fetchResponse: fetchCellsListResponse,
    response: cellsListResponse
  } = useCatalogueList<ICell>({
    settings,
    initialPath: 'workflow-cells/?ordering=-created'
  });

  const { response: sharingScopesResponse } = useCatalogueList<ISharingScope>({
    settings,
    initialPath: 'sharing-scopes/?page_size=100',
    getAllPages: true
  });

  const userInfo = useUserInfo();

  return (
    <Paper
      elevation={12}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 300,
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'scroll',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0
      }}
    >
      <SharingScopesContext.Provider value={sharingScopesResponse.results}>
        <UserInfoContext.Provider value={userInfo}>
          <CellsList
            title="Workflow Components Catalog"
            cells={cellsListResponse.results}
            loading={loading}
            message={
              errorMessage
                ? errorMessage
                : cellsListResponse.count === 0
                  ? 'There are no workflow components in your catalogue. Get started by creating a notebook and containerizing a cell.'
                  : null
            }
            selectedCellInList={selectedCellInList}
            setSelectedCell={setSelectedCell}
            fetchCellsListResponse={fetchCellsListResponse}
            button={
              <Tooltip title="Refresh" arrow>
                <IconButton
                  aria-label="Reload"
                  style={{ color: 'white', borderRadius: '100%' }}
                  onClick={() => fetchCellsListResponse()}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            }
            filter={<ListFilter setUrl={setCellsListUrl} />}
            pageNav={
              <PageNav
                listResponse={cellsListResponse}
                setUrl={setCellsListUrl}
              />
            }
          />
          <CellsList
            title="Special Components"
            cells={specialCells}
            loading={false}
            message={null}
            selectedCellInList={selectedCellInList}
            setSelectedCell={setSelectedCell}
            fetchCellsListResponse={fetchCellsListResponse}
          />
          {/* Drafts live in the chart, not the catalogue, so this section has
              no cells of its own - only the header and its create button. */}
          <CellsList
            title="Draft Components"
            cells={[]}
            loading={false}
            message="Create a placeholder node with custom inputs and outputs before the containerized cell exists."
            selectedCellInList={selectedCellInList}
            setSelectedCell={setSelectedCell}
            fetchCellsListResponse={fetchCellsListResponse}
            button={
              <Tooltip title="New draft node" arrow>
                <IconButton
                  aria-label="New draft node"
                  style={{ color: 'white', borderRadius: '100%' }}
                  onClick={() => setDraftDialogOpen(true)}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <DraftCellDialog
            open={draftDialogOpen}
            onClose={() => setDraftDialogOpen(false)}
            onSave={init => {
              onCreateDraftCell(makeDraftCell(init));
              setDraftDialogOpen(false);
            }}
          />
        </UserInfoContext.Provider>
      </SharingScopesContext.Provider>
    </Paper>
  );
}
