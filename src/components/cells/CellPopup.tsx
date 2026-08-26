import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import { useClickOutside } from '@mantine/hooks';

import { CellInfo } from '../common/CellInfo';
import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { CellInfoHeader } from '../common/CellInfoHeader';

export function CellPopup({
  cell,
  cellNode,
  onClose
}: {
  cell: ICell;
  cellNode: HTMLDivElement | null;
  onClose: () => void;
}) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  useClickOutside(onClose, null, [ref, cellNode]);

  return (
    <Paper
      ref={setRef}
      elevation={12}
      sx={{
        position: 'absolute',
        top: 20,
        left: 'calc(20px + 300px)',
        width: 380,
        maxHeight: 'calc(100% - 40px)',
        overflowX: 'clip',
        overflowY: 'scroll'
      }}
    >
      <CellInfoHeader onClose={onClose}>{cell.title}</CellInfoHeader>
      <CellInfo cell={cell} />
    </Paper>
  );
}
