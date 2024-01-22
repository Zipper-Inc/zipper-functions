import {
  ColumnDef,
  FiltersOptions,
  Row,
  SortingOptions,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { App } from '../../page';
import React from 'react';
import { Button, List, Table, cn } from '@zipper/ui';
import Link from 'next/link';
import { PiBrowserBold, PiCodeSimpleBold } from 'react-icons/pi';

/* -------------------------------------------- */
/* Types                                        */
/* -------------------------------------------- */

interface ZipletTableProps<Data extends App>
  extends FiltersOptions<Data>,
    SortingOptions<Data> {
  data: Data[];
  columns: ColumnDef<Data, any>[];
  isEmpty?: boolean;
  state: {
    globalFilter: string;
    columnVisibility: Record<string, boolean>;
    sorting: SortingState;
  };
}

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

function TableRow<T extends App>(row: Row<T>) {
  return (
    <Table.Row
      className={cn('h-24 bg-background transition-none hover:bg-muted group')}
    >
      <List data={row.getVisibleCells()}>
        {(cell, index) => {
          const position = {
            first: index === 0,
            last: index === row.getVisibleCells().length - 1,
          };

          const ROUTES = {
            EDIT: `/${row.original.resourceOwner.slug}/${row.original.slug}/src/main.ts`,
            VIEW: `${
              process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
            }${row.original.slug}.${
              process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST
            }`,
          };

          return (
            <Table.Cell
              className={cn(
                'relative',
                position.first && 'min-w-[208px]',
                position.last && 'pl-2 w-56',
              )}
            >
              <span
                className={cn(
                  'bg-none transition-all left-0 hidden absolute items-center gap-2 h-24 z-10 bottom-0',
                  index === 2 && 'group-hover:flex bg-muted',
                )}
              >
                <Button
                  asChild
                  variant="outline-secondary"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Link href={ROUTES.EDIT}>
                    <PiCodeSimpleBold />
                    Edit
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline-primary"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Link href={ROUTES.VIEW}>
                    <PiBrowserBold />
                    View
                  </Link>
                </Button>
              </span>

              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Table.Cell>
          );
        }}
      </List>
    </Table.Row>
  );
}

export function ZipletsTable<T extends App>(props: ZipletTableProps<T>) {
  /* ------------------- Hooks ------------------ */
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: { size: 700 },
    ...props,
  });

  /* ------------------ Render ------------------ */
  return (
    <Table>
      <Table.Header>
        <List data={table.getHeaderGroups()}>
          {(headerGroup) => (
            <Table.Row className="hover:bg-background">
              <List data={headerGroup.headers}>
                {(header, index) => (
                  <Table.Head
                    className={cn(
                      `w-[${header.column.getSize()}px]`,
                      index === 0 && 'pl-2',
                    )}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </Table.Head>
                )}
              </List>
            </Table.Row>
          )}
        </List>
      </Table.Header>

      <Table.Body>
        <List data={table.getRowModel().rows} component={TableRow} />
      </Table.Body>
    </Table>
  );
}
