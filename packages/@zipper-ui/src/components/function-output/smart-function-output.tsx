import { useMemo } from 'react';
import {
  TableContainer,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
  Box,
  Text,
  Flex,
  Stack,
  StackDivider,
} from '@chakra-ui/react';
import { OutputType } from '@zipper/types';
import styled from '@emotion/styled';

import { useTable, useSortBy } from 'react-table';
import { ObjectExplorer } from './object-explorer';
import { isPrimitive, parseResult } from './utils';
import { RawFunctionOutput } from './raw-function-output';
import { HiCheck, HiX } from 'react-icons/hi';
import { ActionComponent } from './action-component';
import { RouterComponent } from './router-component';

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
    <TableContainer w="full">
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
    <TableContainer w="full">
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

export function SmartFunctionOutput({
  result,
  level = 0,
}: {
  result: any;
  level?: number;
}) {
  if (!result) return null;

  const { type, data } = parseResult(result);

  switch (type) {
    case OutputType.String:
      return <Text fontSize="2xl">{data.toString()}</Text>;

    case OutputType.Array:
      return <TableArray data={data} />;

    case OutputType.Collection:
      return <TableCollection data={data} />;

    case OutputType.Html:
      return (
        <Box>
          <iframe width="100%" height="400px" srcDoc={data} />
        </Box>
      );

    case OutputType.Object:
      return <ObjectExplorer data={data} level={level} />;

    case OutputType.Action: {
      if (data.run === undefined) data.run = true;
      return <ActionComponent action={data} />;
    }

    case OutputType.Component: {
      const component = data as Zipper.Component;

      switch (component.type) {
        case 'stack': {
          return (
            <Stack
              {...component.props}
              divider={
                component.props.divider ? (
                  <StackDivider borderColor="gray.200" />
                ) : undefined
              }
              spacing={component.props.direction === 'row' ? 6 : 4}
            >
              {component.children.map((child) => {
                return <SmartFunctionOutput result={child} level={level + 1} />;
              })}
            </Stack>
          );
        }
        default:
          break;
      }
    }

    case OutputType.Router:
      return <RouterComponent route={data} />;

    case OutputType.ActionArray:
      return (
        <Flex direction="row">
          {data.map((action: any) => (
            <ActionComponent action={action} />
          ))}
        </Flex>
      );

    default:
      return <RawFunctionOutput result={result} />;
  }
}
