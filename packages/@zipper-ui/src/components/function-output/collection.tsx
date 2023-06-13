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
  CardHeader,
  CardBody,
  StackDivider,
  Avatar,
  Heading,
  Flex,
  Divider,
  CardFooter,
  HStack,
} from '@chakra-ui/react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSortBy, useTable } from 'react-table';
import styled from '@emotion/styled';
import { isPrimitive } from './utils';
import { SmartFunctionOutput } from './smart-function-output';
import { HiCheck, HiX, HiTable, HiViewGrid } from 'react-icons/hi';

export default function Collection(props: { data: Array<any> }) {
  // Define the state to keep track of the selected view
  const [view, setView] = useState<'table' | 'cards'>('table');

  return (
    <Stack>
      <Box display="flex" justifyContent="flex-end" mb={4}>
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
          ml={2}
        />
      </Box>

      {/* Render the appropriate component based on the selected view */}
      {view === 'table' ? (
        <TableCollection data={props.data} />
      ) : (
        <CardCollection data={props.data} />
      )}
    </Stack>
  );
}

const StyledTr = styled(Tr)`
  &:last-of-type td {
    border-bottom: none;
  }
`;

function TableCollection(props: { data: Array<any> }) {
  const columns = useMemo(() => {
    const keys: Array<string> = [];
    props.data.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (!keys.includes(key)) keys.push(key);
      });
    });
    return keys.map((key) => ({ Header: key, accessor: key }));
  }, [props.data]);

  const data = useMemo(() => props.data, [props.data]);

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
                      <SmartFunctionOutput result={cell.value} />
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

function CardCollection(props: { data: Array<any> }) {
  return (
    <SimpleGrid minChildWidth="150px" spacing={10}>
      {props.data.map((item, index) => {
        const hasAction = item.hasOwnProperty('action');

        return (
          <Card
            key={index}
            bgColor="gray.50"
            borderRadius="xl"
            overflow="hidden"
            p={8}
            px={4}
          >
            <CardBody px="0">
              {Object.entries(item).map(([key, value], i) => (
                key !== 'action' && (
                  <Flex flexDirection={{base:'row', sm: 'column'}} justify="space-between" key={i}>
                    <Text color="neutral.500">{key}</Text>
                    <RenderItem item={value} />
                  </Flex>
                )
              ))}
            </CardBody>
            {hasAction && (
              <CardFooter p={0}>
                <Flex flexDirection={{base:'row', sm: 'column'}} justifyContent="space-between" alignItems="center">
                  {item.action.map((action: any) => (
                    <SmartFunctionOutput result={action} />
                  ))}
                </Flex>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </SimpleGrid>
  );
}

const RenderItem: React.FC<{ item: any }> = ({ item }) => {
  if (typeof item === 'object' && item !== null) {
    return (
      <Stack>
        {Object.entries(item).map(([key, value], i) => (
          <React.Fragment key={i}>
            <Text color="neutral.500">{key}</Text>
            <RenderItem item={value} />
          </React.Fragment>
        ))}
      </Stack>
    );
  }
  return <Text fontWeight={600} color="neutral.900">{item}</Text>;
};