import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { ReactNode } from 'react'

interface DataTableProps {
  headers: string[]
  children: ReactNode
  minWidth?: number
}

export function DataTable({ headers, children, minWidth = 650 }: DataTableProps) {
  return (
    <TableContainer>
      <Table sx={{ minWidth }} size="small">
        <TableHead>
          <TableRow>{headers.map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  )
}

