import './table.css';
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  SimpleGrid,
  Stack,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { useMemo, useState } from 'react';
import {
  PiCaretDownFill,
  PiCaretUpFill,
  PiCheckCircleFill,
  PiMagnifyingGlass,
  PiXCircleFill,
} from 'react-icons/pi';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';

import { SmartFunctionOutput } from './smart-function-output';
import { useSmartFunctionOutputContext } from './smart-function-output-context';
import { isAction, isPrimitive } from './utils';

type Props = {
  data: Array<any>;
  tableLevel: number;
  level: number;
};

export default function Collection(props: Props) {
  // Define the state to keep track of the selected view
  const [view] = useState<'table' | 'cards'>('table');
  const { setSearchQuery } = useSmartFunctionOutputContext();

  const isNested = !!props.tableLevel;

  return (
    <Stack width="100%">
      {props.tableLevel === 0 && (
        <Box display="flex" justifyContent="flex-end" gap="4">
          <InputGroup w="md">
            <InputLeftAddon>
              <Icon as={PiMagnifyingGlass} />
            </InputLeftAddon>
            <Input onChange={(e) => setSearchQuery(e.target.value)} />
          </InputGroup>
        </Box>
      )}

      {/* Render the appropriate component based on the selected view */}
      {view === 'table' ? (
        <TableCollection {...props} />
      ) : (
        <CardCollection {...props} />
      )}
    </Stack>
  );
}

function filterData(
  data: Array<any>,
  searchQuery: string,
  tableLevel: number,
  column?: string,
) {
  if (tableLevel > 0) {
    if (data.length === 0) return [{ [column || 'value']: 'No data' }];
    return data;
  }

  const filteredData = data.filter((d) => {
    if (!searchQuery || searchQuery.length === 0) return true;

    if (!d) return false;

    if (isPrimitive(d)) {
      return d.toString().toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (typeof d === 'object') {
      return JSON.stringify(d)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    }
  });

  if (filteredData.length === 0) return [{ [column || 'value']: 'No data' }];

  return filteredData;
}

function TableCollection(props: Props) {
  const columnHelper = createColumnHelper<Record<string, any>>();

  const { searchQuery } = useSmartFunctionOutputContext();

  const columns = useMemo(() => {
    const keys: string[] = [];
    props.data.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (!keys.includes(key)) keys.push(key);
      });
    });

    return keys
      .filter((key) => {
        return !props.data.every((record) => record[key] === null);
      })
      .map((key) =>
        columnHelper.accessor(key, {
          header: key.replaceAll('_', ' '),
          size: props.data.reduce((acc, record) => {
            const value = record[key];
            if (isPrimitive(value)) {
              if (typeof value === 'boolean') {
                return Math.max(acc, 5);
              }
              return Math.max(acc, value.length);
            }
            return acc;
          }, 0),
        }),
      );
  }, [props.data]);

  const data = useMemo(
    () =>
      filterData(
        props.data,
        searchQuery,
        props.tableLevel,
        columns[0]?.header?.toString(),
      ),
    [props.data, searchQuery],
  );

  const tableInstance = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  return (
    <div style={{ width: '100%' }}>
      <table
        {...{
          style: {
            width: '100%',
          },
        }}
      >
        <thead>
          {tableInstance.getHeaderGroups().map((headerGroup) => (
            <tr>
              {headerGroup.headers.map((header) => {
                return (
                  <th>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`resizer ${
                        header.column.getIsResizing() ? 'isResizing' : ''
                      }`}
                    />

                    {
                      <Text
                        as="span"
                        fontSize="xx-small"
                        textAlign="center"
                        height="full"
                        pl={1}
                      >
                        {header.column.getIsSorted() ? (
                          header.column.getIsSorted() === 'asc' ? (
                            <PiCaretDownFill
                              style={{ display: 'inline-block' }}
                            />
                          ) : (
                            <PiCaretUpFill
                              style={{ display: 'inline-block' }}
                            />
                          )
                        ) : (
                          ''
                        )}
                      </Text>
                    }
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {tableInstance.getRowModel().rows.map((row) => {
            return (
              <tr>
                {row.getVisibleCells().map((cell) => {
                  if (isPrimitive(cell.getValue())) {
                    if (typeof cell.getValue() === 'boolean') {
                      return (
                        <td>
                          <HStack
                            w="full"
                            h="full"
                            align="center"
                            justify="center"
                            height={5}
                          >
                            {cell.getValue() ? (
                              <PiCheckCircleFill height={4} />
                            ) : (
                              <PiXCircleFill height={4} />
                            )}
                          </HStack>
                        </td>
                      );
                    }
                    // return <Td>{cell.render('Cell')}</Td>;
                  }
                  if (cell.getValue() === null) {
                    <Td></Td>;
                  }
                  // console.log('size column', cell.getValue().length);
                  return (
                    <td
                      {...{
                        key: cell.id,
                        style: {
                          width: cell.column.getSize(),
                        },
                      }}
                    >
                      <SmartFunctionOutput
                        result={cell.getValue()}
                        tableLevel={props.tableLevel + 1}
                        level={props.level + 1}
                        heading={cell.column.columnDef.header
                          ?.valueOf()
                          .toString()}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CardCollection(props: Props) {
  const { searchQuery } = useSmartFunctionOutputContext();

  const data = useMemo(
    () => filterData(props.data, searchQuery, props.tableLevel),
    [props.data, searchQuery],
  );

  return (
    <SimpleGrid minChildWidth="200px" spacing={10}>
      {data.map((record, index) => {
        return (
          <Card key={index} bgColor="fg.50" overflow="hidden" p={4}>
            <CardBody p={0}>
              {Object.entries(record).map(([key, value]) => {
                if (isPrimitive(value)) {
                  if (typeof value === 'boolean') {
                    return (
                      <Flex
                        align="center"
                        key={key}
                        justifyContent="space-between"
                      >
                        <Text mr="2">{key}:</Text>
                        {value ? <PiCheckCircleFill /> : <PiXCircleFill />}
                      </Flex>
                    );
                  }
                  return (
                    <Flex
                      align="start"
                      key={key}
                      justifyContent="space-between"
                    >
                      <Text color="neutral.500" mr={2}>
                        {key}
                      </Text>
                      <Text fontWeight={600} color="neutral.900">
                        {value as string}
                      </Text>
                    </Flex>
                  );
                }
                return (
                  <CardFooter
                    key={key}
                    p={0}
                    pt={5}
                    width="full"
                    display="block"
                  >
                    {Array.isArray(value) && isAction(value[0]) ? (
                      <SmartFunctionOutput
                        result={value}
                        tableLevel={props.tableLevel + 1}
                        level={props.level + 1}
                      />
                    ) : (
                      <Flex direction="column">
                        <Text color="neutral.500" mr={2}>
                          {key}
                        </Text>

                        <SmartFunctionOutput
                          result={value}
                          tableLevel={props.tableLevel + 1}
                          level={props.level + 1}
                        />
                      </Flex>
                    )}
                  </CardFooter>
                );
              })}
            </CardBody>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
