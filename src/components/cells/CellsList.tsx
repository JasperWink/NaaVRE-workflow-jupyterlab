import React, { ReactNode } from 'react';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { CellNode, LoadingCellNode } from './CellNode';

export function CellsList({
  title,
  cells,
  loading,
  message,
  selectedCellInList,
  setSelectedCell,
  fetchCellsListResponse,
  button,
  filter,
  pageNav
}: {
  title: string;
  cells: Array<ICell>;
  loading: boolean;
  message: string | null;
  selectedCellInList: ICell | null;
  setSelectedCell: (c: ICell | null, n: HTMLDivElement | null) => void;
  fetchCellsListResponse: () => void;
  button?: ReactNode;
  filter?: ReactNode;
  pageNav?: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px',
          paddingRight: '10px',
          paddingLeft: '10px',
          background: '#3c8f49',
          color: 'white',
          fontSize: 'medium'
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
        </span>
        {button && button}
      </div>
      {filter && filter}
      <div>
        {loading ? (
          <>
            <LoadingCellNode />
            <LoadingCellNode />
          </>
        ) : (
          <>
            {message !== null && (
              <p style={{ margin: '10px', textAlign: 'center' }}>{message}</p>
            )}
            {cells.map(cell => (
              <CellNode
                cell={cell}
                selectedCellInList={selectedCellInList}
                setSelectedCell={setSelectedCell}
                fetchCellsListResponse={fetchCellsListResponse}
              />
            ))}
          </>
        )}
      </div>
      {pageNav && pageNav}
    </div>
  );
}
