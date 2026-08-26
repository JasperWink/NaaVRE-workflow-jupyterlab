import React, { useContext, useEffect } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FilterListIcon from '@mui/icons-material/FilterList';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';

import { updateSearchParams } from './ListFilter';
import { SettingsContext } from '../../settings';
import {
  ICheckboxFilter,
  useSharingScopeCheckboxes
} from '../../hooks/use-sharing-scope-checkboxes';

const defaultCheckboxFilters: ICheckboxFilter[] = [
  {
    key: 'all_versions',
    title: 'All versions',
    section: null,
    checked: true,
    getSearchParams: checked => ({
      all_versions: checked ? 'true' : 'false',
      page: null
    })
  },
  {
    key: 'shared_with_me',
    title: 'Shared with me',
    section: null,
    checked: true,
    getSearchParams: checked => ({
      shared_with_me: checked ? 'true' : 'false',
      page: null
    })
  }
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ mt: 2 }}>
      {children}
    </Typography>
  );
}

export function ListFilterCheckboxes({
  setUrl
}: {
  setUrl: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const { checkboxFilters, setCheckboxFilters, checkboxFiltersBySection } =
    useSharingScopeCheckboxes(defaultCheckboxFilters);

  const { virtualLab } = useContext(SettingsContext);

  // Additional checkboxFilters that depend on context
  useEffect(() => {
    const extraCheckboxFilters: ICheckboxFilter[] = [
      {
        key: 'virtual_lab',
        title: 'All virtual labs',
        section: null,
        checked: true,
        getSearchParams: checked => ({
          virtual_lab: checked ? null : virtualLab || null,
          page: null
        })
      }
    ];
    setCheckboxFilters(checkboxFilters => [
      ...extraCheckboxFilters,
      ...checkboxFilters.filter(
        f => !extraCheckboxFilters.some(d => d.key === f.key)
      )
    ]);
  }, [virtualLab]);

  // Call setUrl when checkboxFilter changes
  useEffect(() => {
    checkboxFilters.forEach(filter => {
      setUrl((url: string | null) =>
        updateSearchParams(url, filter.getSearchParams(filter.checked))
      );
    });
  }, [checkboxFilters]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'checkboxfilter-popover' : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        aria-label="checkbox-filters"
        style={{
          borderRadius: '100%'
        }}
        onClick={e => setAnchorEl(e.currentTarget)}
      >
        <FilterListIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        slotProps={{
          paper: {
            sx: {
              maxHeight: anchorEl
                ? `calc(100dvh - ${anchorEl.getBoundingClientRect().bottom + 16}px)`
                : '80vh',
              overflowY: 'auto'
            }
          }
        }}
      >
        <FormGroup sx={{ px: 2, py: 1 }}>
          {checkboxFiltersBySection.map(section => (
            <FormGroup key={section.key}>
              <SectionTitle>{section.title}</SectionTitle>
              {section.checkboxFilters.map(filter => (
                <FormControlLabel
                  key={filter.key}
                  label={filter.title}
                  control={
                    <Checkbox
                      checked={filter.checked}
                      onChange={e => {
                        setCheckboxFilters(checkboxFilters => {
                          const newCheckboxFilters = [...checkboxFilters];
                          newCheckboxFilters[
                            newCheckboxFilters.findIndex(
                              x => x.key === filter.key
                            )
                          ].checked = e.target.checked;
                          return newCheckboxFilters;
                        });
                      }}
                    />
                  }
                />
              ))}
            </FormGroup>
          ))}
        </FormGroup>
      </Popover>
    </>
  );
}
