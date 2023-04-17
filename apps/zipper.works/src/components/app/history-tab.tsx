import { useEffect, useMemo, useState } from 'react';
import { trpc } from '~/utils/trpc';
import { useTable, useFlexLayout, useResizeColumns } from 'react-table';
import {
  Box,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Link,
  Heading,
  VStack,
  Flex,
  Icon,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { Avatar } from '../avatar';
import { useRouter } from 'next/router';
import { HiExclamationTriangle, HiCheck } from 'react-icons/hi2';
import { TbClockPlay } from 'react-icons/tb';

type HistoryTabProps = {
  appId: string;
};

const HistoryTab: React.FC<HistoryTabProps> = ({ appId }) => {
  const appRuns = trpc.useQuery(['appRun.all', { appId, limit: 500 }]);

  const [data, setData] = useState<any[]>([]);

  const columns = useMemo(
    () => [
      {
        Header: 'Date',
        accessor: 'date', // accessor is the "key" in the data
        width: 80,
      },
      {
        Header: 'Time',
        accessor: 'time',
        width: 80,
      },
      {
        Header: 'Run by',
        accessor: 'user',
        width: 100,
      },
      {
        Header: 'Filename',
        accessor: 'path',
        width: 80,
      },
      {
        Header: 'Inputs',
        accessor: 'inputs',
        width: 120,
      },
      {
        Header: '',
        accessor: 'runUrl',
        width: 10,
      },
    ],
    [],
  );

  const router = useRouter();

  useEffect(() => {
    if (appRuns.data) {
      setData(
        appRuns.data.map((r) => {
          return {
            date: r.createdAt.toLocaleDateString([], {
              month: 'long',
              day: '2-digit',
            }),
            time: (
              <HStack>
                <Link
                  href={`${
                    process.env.NODE_ENV === 'development' ? 'http' : 'https'
                  }://${router.query['app-slug']}.${
                    process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                  }/run/${r.id.split('-')[0]}`}
                >
                  {r.createdAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Link>
                {r.scheduleId && (
                  <Tooltip label="Scheduled run">
                    <span>
                      <Icon as={TbClockPlay} />
                    </span>
                  </Tooltip>
                )}
              </HStack>
            ),
            user: (
              <HStack>
                {r.userId && <Avatar userId={r.userId} size="xs" />}
                <Text>
                  {r.user?.firstName || ''} {r.user?.lastName || ''}
                </Text>
              </HStack>
            ),
            path: <Link href={`./${r.path}`}>{r.path}</Link>,
            inputs:
              typeof r.inputs === 'object'
                ? Object.keys(r.inputs || {})
                    .map(
                      (k) =>
                        `${k}: ${JSON.stringify(
                          (r.inputs as Record<string, string>)[k],
                        )}`,
                    )
                    .join(' / ')
                : r.inputs.toString(),
            runUrl: (
              <>
                {r.success ? (
                  <Link
                    href={`${
                      process.env.NODE_ENV === 'development' ? 'http' : 'https'
                    }://${router.query['app-slug']}.${
                      process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                    }/run/${r.id.split('-')[0]}`}
                  >
                    <Icon as={HiCheck} fill="green.600" />
                  </Link>
                ) : (
                  <Tooltip label={r.result?.toString()}>
                    <span>
                      <Icon as={HiExclamationTriangle} fill="orange.600" />
                    </span>
                  </Tooltip>
                )}
              </>
            ),
          };
        }),
      );
    }
  }, [appRuns.data]);

  const tableInstance = useTable(
    {
      columns,
      data,
      defaultColumn: {
        minWidth: 30,
        width: 150,
        maxWidth: 400,
      },
    },
    useFlexLayout,
    useResizeColumns,
  );
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack flex={1} alignItems="stretch" spacing={0} gap={4}>
        <Heading as="h6" fontWeight={400} flex={1}>
          History
        </Heading>
        <Text display="inline">
          A log of the previous times this app has been run.
        </Text>
      </VStack>
      <Flex flex={4}>
        <Table {...getTableProps()}>
          <Thead>
            {headerGroups.map((headerGroup) => (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any) => (
                  <>
                    <Th
                      {...column.getHeaderProps()}
                      fontWeight="normal"
                      fontSize="sm"
                      textTransform="none"
                      _notFirst={{ pl: 0 }}
                    >
                      {column.render('Header')}
                    </Th>
                    <Box
                      w="2"
                      {...column.getResizerProps()}
                      className={`resizer ${
                        column.isResizing ? 'isResizing' : ''
                      }`}
                    />
                  </>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()} color="gray.600" fontSize="sm">
            {appRuns.data && appRuns.data.length > 0 ? (
              rows.map((row, i) => {
                prepareRow(row);
                return (
                  <Tr {...row.getRowProps()}>
                    {row.cells.map((cell, j) => {
                      return (
                        <Td
                          {...cell.getCellProps({
                            style: { whiteSpace: 'nowrap' },
                          })}
                          // fontSize={cell.column.Header === 'Date' ? 'md' : 'sm'}
                          fontWeight={
                            cell.column.Header === 'Date'
                              ? 'semibold'
                              : 'normal'
                          }
                          isTruncated
                          _notFirst={{ pl: 0 }}
                        >
                          {cell.column.Header === 'Date' &&
                          cell.value === rows[i - 1]?.cells[j]?.value ? (
                            <></>
                          ) : (
                            cell.render('Cell')
                          )}
                        </Td>
                      );
                    })}
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={6}>
                  {appRuns.isLoading ? (
                    <Spinner color="purple" />
                  ) : (
                    "This app hasn't been run yet."
                  )}
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Flex>
    </HStack>
  );
};

export default HistoryTab;
