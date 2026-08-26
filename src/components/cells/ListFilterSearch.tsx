import React, { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';

import { updateSearchParams } from './ListFilter';

export function ListFilterSearch({
  setUrl
}: {
  setUrl: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [search, setSearch] = useState<string | null>(null);
  const [debouncedSearch] = useDebouncedValue(search, 200);

  useEffect(() => {
    setUrl((url: string | null) =>
      updateSearchParams(url, {
        search: debouncedSearch,
        page: null
      })
    );
  }, [debouncedSearch]);

  return (
    <TextField
      value={search}
      onChange={e => setSearch(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: search && (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={() => setSearch('')}
                edge="end"
                style={{
                  borderRadius: '100%'
                }}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
      size="small"
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: '100px'
        },
        width: '100%',
        '&:focus-within': {
          flexShrink: 0
        },
        transition: 'all 0.5s ease'
      }}
    />
  );
}
