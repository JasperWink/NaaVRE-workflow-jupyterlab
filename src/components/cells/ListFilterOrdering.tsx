import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { updateSearchParams } from './ListFilter';

const orderingOptions = [
  { value: 'created', title: 'First created' },
  { value: '-created', title: 'Last created' },
  { value: 'title', title: 'A-Z' },
  { value: '-title', title: 'Z-A' }
];

export function ListFilterOrdering({
  setUrl
}: {
  setUrl: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [ordering, setOrdering] = useState<string | null>('-created');

  useEffect(() => {
    setUrl((url: string | null) =>
      updateSearchParams(url, {
        ordering: ordering,
        page: null
      })
    );
  }, [ordering]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        id="ordering-button"
        aria-label="ordering"
        aria-controls={open ? 'ordering-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        style={{
          borderRadius: '100%'
        }}
        onClick={e => setAnchorEl(e.currentTarget)}
      >
        <SwapVertIcon />
      </IconButton>
      <Menu
        id="ordering-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          list: {
            'aria-labelledby': 'ordering-button'
          }
        }}
      >
        {orderingOptions.map(option => (
          <MenuItem
            key={option.value}
            selected={option.value === ordering}
            onClick={() => {
              setOrdering(option.value);
              setAnchorEl(null);
            }}
          >
            {option.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
