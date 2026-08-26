import { VariableType } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { TextFieldProps } from '@mui/material';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';

export interface IVariableInput {
  type: VariableType;
  value: string;
  setValue: (value: string) => void;
}

function validate(
  value: string,
  type: VariableType
): {
  error: boolean;
  errorText: string;
} {
  if (value === '') {
    return {
      error: false,
      errorText: ''
    };
  }

  switch (type) {
    case 'int': {
      return {
        error: !(Number.isInteger(Number(value)) && value !== null),
        errorText: 'Must be a valid integer'
      };
    }

    case 'float': {
      return {
        error: !(Number.isNaN(Number(value)) && value !== null),
        errorText: 'Must be a valid float'
      };
    }

    case 'list': {
      return (() => {
        let error = true;
        try {
          const parsed = JSON.parse(value);
          error = !Array.isArray(parsed);
        } catch {
          /* empty */
        }
        return {
          error: error,
          errorText: 'Must be a valid list'
        };
      })();
    }

    case 'str':
    case undefined:
    default:
      return {
        error: false,
        errorText: ''
      };
  }
}

export function VariableInput({
  type,
  value,
  setValue,
  ...props
}: IVariableInput & Omit<TextFieldProps, 'type'>) {
  const { error, errorText } = validate(value, type);
  return (
    <TextField
      type="string"
      value={value}
      onChange={e => setValue(e.target.value)}
      error={error}
      helperText={error && errorText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear"
                onClick={() => setValue('')}
                // onMouseDown={handleMouseDownPassword}
                // onMouseUp={handleMouseUpPassword}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
      {...props}
    />
  );
}
