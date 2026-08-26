import * as React from 'react';
import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export function CellInfoHeader({
  children,
  onClose
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        marginTop: '0',
        textAlign: 'center',
        background: '#3c8f49',
        color: 'white',
        fontSize: 'medium',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      <p style={{ margin: '0' }}>{children}</p>
      <IconButton
        aria-label="Close"
        style={{ color: 'white', borderRadius: '100%' }}
        onClick={onClose}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
