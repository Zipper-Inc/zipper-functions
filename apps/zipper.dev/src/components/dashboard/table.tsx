import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  chakra,
  Button,
  HStack,
} from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  ColumnDef,
  TableState,
  FiltersOptions,
  SortingOptions,
  Row,
} from '@tanstack/react-table';
import { PiBrowserBold, PiCodeSimpleBold } from 'react-icons/pi';

export type DataTableProps<Data extends Record<string, unknown>> = {
  data: Data[];
  columns: ColumnDef<Data, any>[];
  isEmpty?: boolean;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  state: Partial<TableState>;
} & FiltersOptions<Data> &
  SortingOptions<Data>;

export function DataTable<Data extends Record<string, unknown>>({
  data,
  columns,
  isEmpty,
  state,
  ...rest
}: DataTableProps<Data>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    state,
    ...rest,
    defaultColumn: {
      size: 700,
    },
  });

  return (
    <Table>
      <Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
              const meta: any = header.column.columnDef.meta;
              return (
                <Th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  isNumeric={meta?.isNumeric}
                  width={header.column.getSize()}
                  _first={{ pl: 2 }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}

                  <chakra.span pl="4">
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === 'desc' ? (
                        <TriangleDownIcon aria-label="sorted descending" />
                      ) : (
                        <TriangleUpIcon aria-label="sorted ascending" />
                      )
                    ) : null}
                  </chakra.span>
                </Th>
              );
            })}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {table.getRowModel().rows.map((row) => (
          <TableRow row={row} key={row.id} />
        ))}
        {isEmpty && (
          <Tr pl="0">
            <Td>
              You're all out of applets. Probably a good time to create one.
            </Td>
            <Td />
          </Tr>
        )}
      </Tbody>
    </Table>
  );
}

const TableRow: React.FC<{ row: Row<any> }> = ({ row }) => {
  const [isHovering, setIsHovering] = React.useState(false);
  return (
    <Tr
      key={row.id}
      backgroundColor={isHovering ? 'fg.50' : 'bgColor'}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {row.getVisibleCells().map((cell, i) => {
        // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
        const meta: any = cell.column.columnDef.meta;
        if (i < 2 || !isHovering) {
          return (
            <Td
              key={cell.id}
              isNumeric={meta?.isNumeric}
              _last={{ minW: '207px' }}
              _first={{ pl: 2 }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Td>
          );
        }
        if (i === 2 && isHovering) {
          return (
            <Td key={cell.id}>
              <HStack>
                <Link
                  href={`/${row.original.resourceOwner.slug}/${row.original.slug}/src/main.ts`}
                >
                  <Button
                    variant="outline"
                    colorScheme="purple"
                    size="sm"
                    leftIcon={<PiCodeSimpleBold />}
                  >
                    Edit
                  </Button>
                </Link>
                <Link
                  href={`${
                    process.env.NODE_ENV === 'development'
                      ? 'http://'
                      : 'https://'
                  }${row.original.slug}.${
                    process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST
                  }`}
                >
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<PiBrowserBold />}
                  >
                    View
                  </Button>
                </Link>
              </HStack>
            </Td>
          );
        }
      })}
    </Tr>
  );
};
