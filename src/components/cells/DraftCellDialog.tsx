import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

// Every type the catalogue service accepts — see the note on VariableType.
// Not a shortlist: adding to it needs a matching change in the service.
const VARIABLE_TYPES: VariableType[] = ['str', 'int', 'float', 'list'];

import {
  ICell,
  VariableType
} from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { IDraftCellInit } from '../../utils/specialCells';

interface IVariable {
  name: string;
  type: VariableType;
}

const DEFAULT_TYPE: VariableType = 'str';

function toVariables(
  vars: Array<{ name: string; type: VariableType | null }> | undefined
): IVariable[] {
  return (vars || []).map(v => ({
    name: v.name,
    type: v.type || DEFAULT_TYPE
  }));
}

function VariableListEditor({
  label,
  variables,
  setVariables
}: {
  label: string;
  variables: IVariable[];
  setVariables: (v: IVariable[]) => void;
}) {
  const update = (i: number, patch: Partial<IVariable>) => {
    setVariables(variables.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  };
  const remove = (i: number) => {
    setVariables(variables.filter((_, j) => j !== i));
  };
  const add = () => {
    setVariables([...variables, { name: '', type: DEFAULT_TYPE }]);
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{ mt: 2, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle2">{label}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={add}>
          Add
        </Button>
      </Stack>
      {variables.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          No {label.toLowerCase()} yet.
        </Typography>
      )}
      {variables.map((v, i) => (
        <Stack key={i} direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            label="name"
            value={v.name}
            onChange={e => update(i, { name: e.target.value })}
            sx={{ flex: 2 }}
          />
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>type</InputLabel>
            <Select
              label="type"
              value={v.type}
              onChange={e =>
                update(i, { type: e.target.value as VariableType })
              }
            >
              {VARIABLE_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            aria-label={`Remove ${label} ${i + 1}`}
            onClick={() => remove(i)}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
    </>
  );
}

export function DraftCellDialog({
  open,
  onClose,
  onSave,
  initialCell = null
}: {
  open: boolean;
  onClose: () => void;
  onSave: (init: IDraftCellInit) => void;
  initialCell?: ICell | null;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputs, setInputs] = useState<IVariable[]>([]);
  const [outputs, setOutputs] = useState<IVariable[]>([]);

  // (Re)initialise the form whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setTitle(initialCell?.title || '');
      setDescription(initialCell?.description || '');
      setInputs(toVariables(initialCell?.inputs));
      setOutputs(toVariables(initialCell?.outputs));
    }
  }, [open, initialCell]);

  const isEdit = initialCell !== null;
  const allVars = [...inputs, ...outputs];
  const names = allVars.map(v => v.name.trim());
  const hasEmptyName = names.some(n => n === '');
  const duplicateNames = names.filter(
    (n, i) => n !== '' && names.indexOf(n) !== i
  );
  const hasDuplicateName = duplicateNames.length > 0;
  const titleEmpty = title.trim() === '';
  const valid = !titleEmpty && !hasEmptyName && !hasDuplicateName;

  const handleSave = () => {
    if (!valid) {
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      inputs: inputs.map(v => ({
        name: v.name.trim(),
        type: v.type || null
      })),
      outputs: outputs.map(v => ({
        name: v.name.trim(),
        type: v.type || null
      })),
      url: initialCell?.url
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit draft node' : 'New draft node'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Define a placeholder node and its inputs/outputs before the
          containerized cell or notebook exists.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          required
          label="Name"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={titleEmpty}
          helperText={titleEmpty ? 'A name is required.' : ' '}
          sx={{ mt: 1 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          sx={{ mt: 1 }}
        />
        <VariableListEditor
          label="Inputs"
          variables={inputs}
          setVariables={setInputs}
        />
        <VariableListEditor
          label="Outputs"
          variables={outputs}
          setVariables={setOutputs}
        />
        {hasEmptyName && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Every input and output needs a name.
          </Alert>
        )}
        {hasDuplicateName && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Input/output names must be unique:{' '}
            {Array.from(new Set(duplicateNames)).join(', ')}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!valid} onClick={handleSave}>
          {isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
