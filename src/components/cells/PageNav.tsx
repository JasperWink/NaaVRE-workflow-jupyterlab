import React from 'react';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import {
  getPageNumberAndCount,
  ICatalogueListResponse
} from '../../utils/catalog';

export function PageNav({
  listResponse,
  setUrl
}: {
  listResponse: ICatalogueListResponse<any>;
  setUrl: (u: string | null) => void;
}) {
  const [currentPage, pageCount] = getPageNumberAndCount(listResponse);
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <IconButton
        aria-label="Previous"
        style={{ borderRadius: '100%' }}
        onClick={() => setUrl(listResponse.previous)}
        sx={{
          visibility: listResponse.previous === null ? 'hidden' : 'visible'
        }}
      >
        <NavigateBeforeIcon />
      </IconButton>
      <p>
        Page {currentPage} of {pageCount}
      </p>
      <IconButton
        aria-label="Next"
        style={{ borderRadius: '100%' }}
        onClick={() => setUrl(listResponse.next)}
        sx={{
          visibility: listResponse.next === null ? 'hidden' : 'visible'
        }}
      >
        <NavigateNextIcon />
      </IconButton>
    </Stack>
  );
}
