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
import SmartFunctionOutputProvider from './smart-function-output-context';
import Collection from './collection';
import Array from './array';

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
      return <Array data={data} />;

    case OutputType.Collection:
      return <Collection data={data} />;

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
