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
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
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
import { useSortBy, useTable } from 'react-table';
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

const StyledTr = styled(Tr)`
  vertical-align: top;
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
    return keys.map((key) => ({
      Header: key.replaceAll('_', ' '),
      accessor: key,
    }));
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
                  if (isPrimitive(cell.value)) {
                    if (typeof cell.value === 'boolean') {
                      return (
                        <Td {...cell.getCellProps()}>
                          <HStack
                            w="full"
                            h="full"
                            align="center"
                            justify="center"
                            height={5}
                          >
                            {cell.value ? (
                              <PiCheckCircleFill height={4} />
                            ) : (
                              <PiXCircleFill height={4} />
                            )}
                          </HStack>
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
                    <Td py={3} px={4} {...cell.getCellProps()}>
                      <SmartFunctionOutput
                        result={cell.value}
                        tableLevel={props.tableLevel + 1}
                        level={props.level + 1}
                        heading={cell.column.Header?.toString()}
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
