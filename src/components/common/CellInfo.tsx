import React, { CSSProperties, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { ICell } from '../../naavre-common/types/NaaVRECatalogue/WorkflowCells';
import { getVariableColor } from '../../utils/chart';

function PropsTable({
  title,
  rows
}: {
  title?: string;
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <>
      {title && (
        <Typography
          component="h4"
          sx={{ marginTop: '16px', marginBottom: '16px' }}
        >
          {title}
        </Typography>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            {rows.map(cells => (
              <PropsTableRow cells={cells} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function PropsTableRow({ cells }: { cells: Array<ReactNode> }) {
  return (
    <TableRow>
      {cells.map(cell => (
        <TableCell>{cell}</TableCell>
      ))}
    </TableRow>
  );
}

function IOVarDot({
  name,
  color
}: {
  name: string;
  color?: CSSProperties['color'];
}) {
  return (
    <div
      style={{
        width: '20px',
        height: '20px',
        background: color || getVariableColor(name),
        borderRadius: '50%'
      }}
    />
  );
}

export function CellInfo({ cell }: { cell: ICell }) {
  const isSpecialNode = cell.title === 'Splitter' || cell.title === 'Merger';

  const cellTables = [
    {
      title: undefined,
      rows: [
        ['Description', cell.description],
        ['Owner', cell.owner],
        [
          'Version',
          isSpecialNode ? null : cell.version ? `${cell.version}` : 'N/A'
        ],
        [
          'Shared',
          isSpecialNode
            ? null
            : (cell.shared_with_scopes || []).length > 0 ||
                (cell.shared_with_users || []).length > 0
              ? 'Yes'
              : 'No'
        ],
        ['Draft', cell.is_draft ? 'Yes' : 'No']
      ]
    },
    {
      title: 'Inputs',
      rows: cell.inputs.map(v => [
        <IOVarDot
          name={v.name}
          color={isSpecialNode ? '#3C8F49' : undefined}
        />,
        v.name,
        v.type
      ])
    },
    {
      title: 'Outputs',
      rows: cell.outputs.map(v => [
        <IOVarDot
          name={v.name}
          color={isSpecialNode ? '#3C8F49' : undefined}
        />,
        v.name,
        v.type
      ])
    },
    {
      title: 'Parameters',
      rows: cell.params.map(v =>
        v.default_value
          ? [v.name, v.type, v.default_value]
          : [v.name, v.type, <p style={{ fontStyle: 'italic' }}>n/a</p>]
      )
    },
    {
      title: 'Secrets',
      rows: cell.secrets.map(v => [v.name, v.type])
    },
    {
      title: 'Technical information',
      rows: [
        ['Image name', cell.container_image],
        ['Base image (build)', cell.base_container_image?.build],
        ['Base image (runtime)', cell.base_container_image?.runtime],
        ['Kernel', cell.kernel],
        [
          'Source',
          cell.source_url && (
            <Link href={cell.source_url} target="_blank" rel="noreferrer">
              {cell.source_url}
            </Link>
          )
        ]
      ]
    }
  ];
  const cellTablesFiltered = cellTables
    .map(({ title, rows }) => ({
      title: title,
      rows: rows.filter(
        row =>
          row.at(-1) !== undefined && row.at(-1) !== null && row.at(-1) !== ''
      )
    }))
    .filter(({ rows }) => rows.length > 0);

  return (
    <Box sx={{ margin: '15px' }}>
      {cellTablesFiltered.map(({ title, rows }) => (
        <PropsTable title={title} rows={rows} />
      ))}
    </Box>
  );
}
