import {
  Stack,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  Td,
  Box,
  SimpleGrid,
  IconButton,
  Card,
  CardBody,
  Flex,
  CardFooter,
  HStack,
  InputGroup,
  InputLeftAddon,
  Icon,
  Input,
} from '@chakra-ui/react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSortBy, useTable } from 'react-table';
import styled from '@emotion/styled';
import { isAction, isPrimitive } from './utils';
import { SmartFunctionOutput } from './smart-function-output';
import { HiCheck, HiX, HiTable, HiViewGrid } from 'react-icons/hi';
import { FiSearch } from 'react-icons/fi';
import { useSmartFunctionOutputContext } from './smart-function-output-context';

type Props = {
  data: Array<any>;
  tableLevel: number;
  level: number;
};

export default function Collection(props: Props) {
  // Define the state to keep track of the selected view
  const [view, setView] = useState<'table' | 'cards'>('table');
  const { setSearchQuery } = useSmartFunctionOutputContext();

  return (
    <Stack
      width="100%"
      border="1px solid"
      borderColor="fg.200"
      p="2"
      borderRadius="md"
    >
      {props.tableLevel === 0 && (
        <Box display="flex" justifyContent="flex-end" gap="2">
          <InputGroup w="md">
            <InputLeftAddon>
              <Icon as={FiSearch} />
            </InputLeftAddon>
            <Input onChange={(e) => setSearchQuery(e.target.value)} />
          </InputGroup>
          <IconButton
            aria-label="Table view"
            icon={<HiTable />}
            onClick={() => setView('table')}
            colorScheme={view === 'table' ? 'purple' : 'gray'}
          />
          <IconButton
            aria-label="Card view"
            icon={<HiViewGrid />}
            onClick={() => setView('cards')}
            colorScheme={view === 'cards' ? 'purple' : 'gray'}
          />
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

const StyledTr = styled(Tr)`
  &:last-of-type td {
    border-bottom: none;
  }
`;

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
  const { searchQuery } = useSmartFunctionOutputContext();
  const columns = useMemo(() => {
    const keys: Array<string> = [];
    props.data.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (!keys.includes(key)) keys.push(key);
      });
    });
    return keys.map((key) => ({ Header: key, accessor: key }));
  }, [props.data]);

  const data = useMemo(
    () =>
      filterData(props.data, searchQuery, props.tableLevel, columns[0]?.Header),
    [props.data, searchQuery],
  );

  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } =
    useTable({ columns, data }, useSortBy);

  return (
    <TableContainer>
      <Table {...getTableProps()}>
        <Thead>
          <Tr>
            {headers.map((column: any) => {
              return (
                <Th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  {
                    <Text
                      as="span"
                      fontSize="xx-small"
                      textAlign="center"
                      height="full"
                      pl={2}
                    >
                      {column.isSorted ? (column.isSortedDesc ? '▼' : '▲') : ''}
                    </Text>
                  }
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <StyledTr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  if (isPrimitive(cell.value)) {
                    if (typeof cell.value === 'boolean') {
                      return (
                        <Td {...cell.getCellProps()}>
                          {cell.value ? <HiCheck /> : <HiX />}
                        </Td>
                      );
                    }
                    return (
                      <Td {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                    );
                  }
                  if (cell.value === null) {
                    <Td {...cell.getCellProps()}></Td>;
                  }
                  return (
                    <Td {...cell.getCellProps()}>
                      <SmartFunctionOutput
                        result={cell.value}
                        tableLevel={props.tableLevel + 1}
                        level={props.level + 1}
                      />
                    </Td>
                  );
                })}
              </StyledTr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
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
          <Card
            key={index}
            bgColor="fg.50"
            borderRadius="xl"
            overflow="hidden"
            p={4}
          >
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
                        {value ? <HiCheck /> : <HiX />}
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
