import React from 'react';
import Stack from '@mui/material/Stack';

import { ListFilterSearch } from './ListFilterSearch';
import { ListFilterOrdering } from './ListFilterOrdering';
import { ListFilterCheckboxes } from './ListFilterCheckboxes';

export function updateSearchParams(
  url: string | null,
  params: { [key: string]: string | null }
): string | null {
  if (url === null) {
    return null;
  }
  const newUrl = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === '') {
      newUrl.searchParams.delete(key);
    } else {
      newUrl.searchParams.set(key, value);
    }
  }
  return newUrl.toString();
}

export function ListFilter({
  setUrl
}: {
  setUrl: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        justifyContent: 'start',
        alignItems: 'center',
        padding: '10px'
      }}
    >
      <ListFilterSearch setUrl={setUrl} />
      <ListFilterCheckboxes setUrl={setUrl} />
      <ListFilterOrdering setUrl={setUrl} />
    </Stack>
  );
}
