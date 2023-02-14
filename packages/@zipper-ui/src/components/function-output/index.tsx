import { OutputType } from '@zipper/types';
import { useTable, useSortBy } from 'react-table';
import {
  Box,
  Text,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { Props } from './types';
import { parseResult } from './utils';
import { RawFunctionOutput } from './raw-function-output';
import { ObjectExplorer } from './object-explorer';

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

  return (
    <TableContainer>
      <Table {...getTableProps()}>
        <Thead>
          {headers.map((column: any) => {
            const isIndex = column.id === 'index';
            return (
              <Th
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
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <Tr {...row.getRowProps()}>
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
              </Tr>
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
    <TableContainer>
      <Table {...getTableProps()}>
        <Thead>
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
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <Tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <Td {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                  );
                })}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function SmartFunctionOutput({ result, level = 0 }: Props) {
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

    default:
      return <RawFunctionOutput result={result} />;
  }
}

export function FunctionOutput({ result, level = 0 }: Props) {
  return (
    <Tabs colorScheme="purple" variant="enclosed">
      <TabList>
        <Tab>Result</Tab>
        <Tab>Raw Output</Tab>
      </TabList>
      <TabPanels
        border="1px solid"
        borderColor="gray.200"
        borderBottomRadius={'md'}
      >
        <TabPanel>
          <SmartFunctionOutput result={result} level={level} />
        </TabPanel>
        <TabPanel backgroundColor="gray.100">
          <RawFunctionOutput result={result} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
