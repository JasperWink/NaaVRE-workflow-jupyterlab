import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { useSharingScopeCheckboxes } from '../../hooks/use-sharing-scope-checkboxes';
import { fetchListFromCatalogue } from '../../utils/catalog';
import { SettingsContext } from '../../settings';
import { IUser } from '../../naavre-common/types/NaaVRECatalogue/BaseAssets';
import { NaaVREExternalService } from '../../naavre-common/handler';
import { SxProps } from '@mui/material/styles';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ mt: 2 }}>
      {children}
    </Typography>
  );
}

function ShareWithUsersAutocomplete({
  usernames,
  setUsernames,
  disabled,
  sx
}: {
  usernames: string[];
  setUsernames: (u: string[]) => void;
  disabled: boolean;
  sx?: SxProps;
}) {
  const settings = useContext(SettingsContext);

  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<readonly string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = useState<string | null>(null);
  const [debouncedInputValue] = useDebouncedValue(inputValue, 200);

  useEffect(() => {
    const url =
      debouncedInputValue && settings.catalogueServiceUrl
        ? `${settings.catalogueServiceUrl}/users/?search=${debouncedInputValue}`
        : null;
    if (url) {
      setLoading(true);
      fetchListFromCatalogue<IUser>(url)
        .then(resp => {
          setOptions(resp.results.map(u => u.username));
        })
        .catch(error => {
          const msg = `Error loading cells: ${String(error)}`;
          console.error(msg);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [debouncedInputValue]);

  return (
    <Autocomplete
      multiple
      sx={sx}
      open={open}
      disabled={disabled}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setOptions([]);
      }}
      value={usernames}
      onChange={(event, newValue) => setUsernames(newValue)}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      noOptionsText="Search users"
      options={options}
      loading={loading}
      filterOptions={x => x}
      renderInput={params => (
        <TextField
          {...params}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              )
            }
          }}
        />
      )}
    />
  );
}

export function CellShareDialog({
  open,
  onClose,
  onUpdated,
  cell,
  readonly
}: {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  cell: ICell;
  readonly: boolean;
}) {
  const [usernames, setUsernames] = useState<string[]>([]);

  const {
    checkboxFilters,
    setCheckboxFilters,
    checkboxFiltersBySection,
    activeSharingScopes
  } = useSharingScopeCheckboxes([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStateFromCell = useCallback(
    (cell: ICell) => {
      setUsernames(usernames => cell.shared_with_users || []);
      setCheckboxFilters(checkboxFilters => {
        checkboxFilters.forEach(f => {
          f.checked = cell.shared_with_scopes?.includes(f.key) || false;
        });
        return checkboxFilters;
      });
    },
    [setUsernames, setCheckboxFilters]
  );

  useEffect(() => {
    setStateFromCell(cell);
  }, [cell]);

  // Update activeSharingScopes when checkboxFilters changes.
  // This is awkward because useSharingScopeCheckboxes was first designed for ListFilterCheckbox. In the future, it should be updated for better reusability.
  useEffect(() => {
    checkboxFilters.forEach(filter => {
      filter.getSearchParams(filter.checked);
    });
  }, [checkboxFilters]);

  const saveCell = useCallback(async () => {
    const resp = await NaaVREExternalService(
      'PATCH',
      cell.url,
      {
        accept: 'application/json'
      },
      {
        shared_with_users: usernames,
        shared_with_scopes: Array.from(activeSharingScopes)
      }
    );
    if (resp.status_code !== 200) {
      throw `${resp.status_code} ${resp.reason}`;
    }
  }, [cell, usernames, activeSharingScopes]);

  const onCancel = useCallback(async () => {
    onClose();
    // reset state
    setStateFromCell(cell);
  }, [onClose]);

  const onApply = useCallback(async () => {
    setError(null);
    setLoading(true);
    saveCell()
      .then(onClose)
      .then(onUpdated)
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [onClose, onUpdated]);

  return (
    <Dialog open={open}>
      <DialogTitle>{cell.title}</DialogTitle>
      <DialogContent>
        {readonly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You cannot modify this cell because it belongs to another user.
          </Alert>
        )}
        <SectionTitle>Share with users</SectionTitle>
        <ShareWithUsersAutocomplete
          usernames={usernames}
          setUsernames={setUsernames}
          disabled={readonly}
          sx={{
            width: 500,
            mt: 1
          }}
        />
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
                    disabled={readonly}
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
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Cannot update cell: {error}
          </Alert>
        )}
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={readonly} onClick={onApply}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
