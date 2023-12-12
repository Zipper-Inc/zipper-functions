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
  InputGroup,
  Icon,
  Input,
  InputLeftAddon,
} from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';
import { useSortBy, useTable } from 'react-table';
import styled from '@emotion/styled';
import { HiTable, HiViewGrid } from 'react-icons/hi';
import { FiSearch } from 'react-icons/fi';
import { useSmartFunctionOutputContext } from './smart-function-output-context';
import { HeadingMode, ObjectExplorerRow } from './object-explorer';
import { PiCaretDownFill, PiCaretUpFill } from 'react-icons/pi';

type Props = {
  data: Array<any>;
  tableLevel: number;
  heading?: string;
  expandable?: boolean;
};

export default function Array(props: Props) {
  // Define the state to keep track of the selected view
  const [view, setView] = useState<'table' | 'cards'>('table');
  const { setSearchQuery } = useSmartFunctionOutputContext();

  return (
    <Stack>
      {props.tableLevel === 0 && (
        <Box display="flex" justifyContent="flex-end" gap="2">
          <InputGroup w="md">
            <InputLeftAddon>
              <Icon as={FiSearch} />
            </InputLeftAddon>
            <Input onChange={(e) => setSearchQuery(e.target.value)} />
          </InputGroup>
        </Box>
      )}

      {/* Render the appropriate component based on the selected view */}
      {view === 'table' ? (
        <TableArray {...props} />
      ) : (
        <CardCollection {...props} />
      )}
    </Stack>
  );
}

const StyledTr = styled(Tr)`
  vertical-align: top;
  &:last-of-type td {
    border-bottom: none;
  }
`;

function TableArray(props: Props) {
  const expandable = props.expandable || !!props.tableLevel;
  const { searchQuery } = useSmartFunctionOutputContext();

  const columns = useMemo(
    () =>
      [
        { Header: '', accessor: 'index' },
        { Header: 'Value', accessor: 'value' },
      ] as Array<any>,
    [],
  );

  const data = useMemo(() => {
    const filteredData = props.data
      .filter((d) => {
        if (searchQuery === '') return true;
        return d.toString().toLowerCase().includes(searchQuery);
      })
      .map((value, index) => ({ index, value }));
    if (filteredData.length === 0) return [{ index: 0, value: 'No results' }];
    return filteredData;
  }, [props.data, searchQuery]);

  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } =
    useTable({ columns, data }, useSortBy);

  if (!props.data.length) {
    return <Text color="fg.500">No results</Text>;
  }

  if (props.heading && expandable) {
    return (
      <ObjectExplorerRow
        key={props.heading}
        heading={props.heading}
        data={props.data}
        level={props.tableLevel + 1}
        tableLevel={props.tableLevel + 1}
        collapse={Object.keys(props.data).length > 1}
        headingMode={HeadingMode.ExpandableTableCell}
      />
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
                      pl={1}
                    >
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <PiCaretDownFill
                            style={{ display: 'inline-block' }}
                          />
                        ) : (
                          <PiCaretUpFill style={{ display: 'inline-block' }} />
                        )
                      ) : (
                        ''
                      )}
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
                      color={isIndex ? 'fg.400' : undefined}
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

function CardCollection(props: Props) {
  const { searchQuery } = useSmartFunctionOutputContext();
  const data = useMemo(
    () =>
      props.data
        .filter((d) => {
          if (searchQuery === '') return true;
          return d.toString().toLowerCase().includes(searchQuery);
        })
        .map((value, index) => ({ index, value })),
    [props.data, searchQuery],
  );

  return (
    <SimpleGrid columns={4} spacing={10}>
      {data.map((item, index) => (
        <Card
          key={index}
          bgColor="neutral.50"
          overflow="hidden"
          px={8}
          py={6}
          maxW="sm"
        >
          <CardBody px="0">
            <SimpleGrid spacing={2}>
              <React.Fragment key={index}>
                <Text fontWeight={600} color="neutral.900">
                  {item.value as string}
                </Text>
              </React.Fragment>
            </SimpleGrid>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
}
