import * as React from 'react';
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
  Icon,
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
import { HiExternalLink } from 'react-icons/hi';
import { useRouter } from 'next/router';
import { VscCode } from 'react-icons/vsc';

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
  const router = useRouter();
  return (
    <Tr
      key={row.id}
      backgroundColor={isHovering ? 'fg50' : 'white'}
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
                <Button
                  variant={'outline'}
                  colorScheme="purple"
                  size={'sm'}
                  onClick={() =>
                    window.location.replace(
                      `/${row.original.resourceOwner.slug}/${row.original.slug}/edit/main.ts`,
                    )
                  }
                >
                  <Icon as={VscCode} mr="1" />
                  Edit
                </Button>
                <Button
                  variant={'outline'}
                  colorScheme="purple"
                  size={'sm'}
                  onClick={() =>
                    router.push(
                      `${
                        process.env.NODE_ENV === 'development'
                          ? 'http://'
                          : 'https://'
                      }${row.original.slug}.${
                        process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                      }`,
                    )
                  }
                >
                  <Icon as={HiExternalLink} mr="1" />
                  View
                </Button>
              </HStack>
            </Td>
          );
        }
      })}
    </Tr>
  );
};
