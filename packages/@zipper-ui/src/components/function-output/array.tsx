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
  CardFooter,
  Flex,
} from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';
import { useSortBy, useTable } from 'react-table';
import styled from '@emotion/styled';
import { HiTable, HiViewGrid } from 'react-icons/hi';
import { SmartFunctionOutput } from './smart-function-output';

export default function Array(props: { data: Array<any> }) {
  // Define the state to keep track of the selected view
  const [view, setView] = useState<'table' | 'cards'>('table');

  return (
    <Stack>
      <Box display="flex" justifyContent="flex-end" mb={4}>
        <IconButton
          aria-label="Table view"
          icon={<HiTable />}
          onClick={() => setView('table')}
          colorScheme={view === 'table' ? 'blue' : 'gray'}
        />
        <IconButton
          aria-label="Card view"
          icon={<HiViewGrid />}
          onClick={() => setView('cards')}
          colorScheme={view === 'cards' ? 'blue' : 'gray'}
          ml={2}
        />
      </Box>

      {/* Render the appropriate component based on the selected view */}
      {view === 'table' ? (
        <TableArray data={props.data} />
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

function TableArray(props: { data: Array<any> }) {
  const columns = useMemo(
    () =>
      [
        { Header: '', accessor: 'index' },
        { Header: 'Value', accessor: 'value' },
      ] as Array<any>,
    [],
  );

  const data = useMemo(
    () => props.data.map((value, index) => ({ index, value })),
    [props.data],
  );

  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } =
    useTable({ columns, data }, useSortBy);

  if (data.length === 0) {
    return (
      <Text
        py={6}
        size="sm"
        color={'gray.500'}
        alignItems={'end'}
        flex={1}
        noOfLines={1}
      >
        Empty array
      </Text>
    );
  }

  return (
    <TableContainer>
      <Table {...getTableProps()}>
        <Thead>
          <Tr>
            {headers.map((column: any) => {
              const isIndex = column.id === 'index';
              return (
                <Th
                  key={column.id}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  width={isIndex ? '20px' : undefined}
                >
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
                  const isIndex = cell.column.id === 'index';
                  return (
                    <Td
                      {...cell.getCellProps()}
                      isNumeric={isIndex}
                      color={isIndex ? 'gray.400' : undefined}
                    >
                      {cell.render('Cell')}
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
  console.log(props.data);
  return (
    <SimpleGrid columns={4} spacing={10}>
      {props.data.map((item, index) => (
        <Card
          key={index}
          bgColor="neutral.50"
          borderRadius="xl"
          overflow="hidden"
          px={8}
          py={6}
          maxW="sm"
        >
          <CardBody px="0">
            <SimpleGrid spacing={2}>
              <React.Fragment key={index}>
                <Text color="neutral.500">{index}</Text>
                <Text fontWeight={600} color="neutral.900">
                  {item.value as string}
                </Text>
              </React.Fragment>
            </SimpleGrid>
          </CardBody>
          <CardFooter p={0}>
            <Flex justifyContent="space-between" alignItems="center">
              {item.action &&
                item.action.map((action: any) => (
                  <SmartFunctionOutput result={action} />
                ))}
            </Flex>
          </CardFooter>
        </Card>
      ))}
    </SimpleGrid>
  );
}
