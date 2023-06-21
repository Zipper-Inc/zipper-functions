import { useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';
import {
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
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { HiExclamationTriangle, HiCheck } from 'react-icons/hi2';
import { TbClockPlay } from 'react-icons/tb';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AppRun } from '@prisma/client';
import { User } from '@clerk/clerk-sdk-node';
import { JSONViewer } from '../json-editor';

type HistoryTabProps = {
  appId: string;
};

const HistoryTab: React.FC<HistoryTabProps> = ({ appId }) => {
  const appRuns = trpc.useQuery(['appRun.all', { appId, limit: 100 }]);

  const [data, setData] = useState<any[]>([]);

  const columnHelper = createColumnHelper<AppRun & { user: User }>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalValue, setModalValue] = useState<any>();
  const [modalHeading, setModalHeading] = useState<string>();

  const columns = [
    //date
    columnHelper.accessor(
      (row) =>
        row.createdAt.toLocaleDateString([], {
          month: 'long',
          day: '2-digit',
        }),
      {
        id: 'date',
        header: 'Date',
        size: 80,
      },
    ),
    //time
    columnHelper.accessor(
      (row) =>
        row.createdAt.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      {
        id: 'time',
        header: 'Time',
        size: 80,

        cell: ({
          getValue,
          row: {
            original: { id, scheduleId },
          },
        }) => {
          return (
            <HStack>
              <Link
                href={`${
                  process.env.NODE_ENV === 'development' ? 'http' : 'https'
                }://${router.query['app-slug']}.${
                  process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                }/run/history/${id.split('-')[0]}`}
              >
                {getValue()}
              </Link>
              {scheduleId && (
                <Tooltip label="Scheduled run">
                  <span>
                    <Icon as={TbClockPlay} />
                  </span>
                </Tooltip>
              )}
            </HStack>
          );
        },
      },
    ),
    //run by
    columnHelper.accessor(
      (row) => {
        return `${row.user?.name || ''}`;
      },
      {
        id: 'user',
        size: 100,
        header: 'Run by',
        cell: ({ getValue }) => {
          return <Text>{getValue()}</Text>;
        },
      },
    ),
    //path
    columnHelper.accessor('path', {
      id: 'path',
      header: 'Filename',
      size: 80,
      cell({
        row: {
          original: { path },
        },
      }) {
        return <Link href={`./${path}`}>{path}</Link>;
      },
    }),
    columnHelper.accessor('inputs', {
      id: 'inputs',
      header: 'Inputs',
      size: 120,
      cell({
        row: {
          original: { inputs, createdAt },
        },
      }) {
        const inputString =
          typeof inputs === 'object'
            ? Object.keys(inputs || {})
                .map(
                  (k) =>
                    `${k}: ${JSON.stringify(
                      (inputs as Record<string, string>)[k],
                    )}`,
                )
                .join(' / ')
            : inputs.toString();
        return (
          <HStack
            cursor="pointer"
            maxW={'lg'}
            _hover={{ color: 'purple' }}
            onClick={() => {
              setModalHeading(
                `${createdAt.toLocaleDateString()} @ ${createdAt.toLocaleTimeString()}`,
              );
              setModalValue(JSON.stringify(inputs, null, 2));
              onOpen();
            }}
          >
            <Text isTruncated>{inputString}</Text>
          </HStack>
        );
      },
    }),
    //runUrl
    columnHelper.accessor(
      (row) => {
        return `${
          process.env.NODE_ENV === 'development' ? 'http' : 'https'
        }://${router.query['app-slug']}.${
          process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
        }/run/history/${row.id.split('-')[0]}`;
      },
      {
        id: 'runUrl',
        header: '',
        size: 10,
        cell({
          getValue,
          row: {
            original: { success, result },
          },
        }) {
          return (
            <>
              {success ? (
                <Link href={getValue()}>
                  <Icon as={HiCheck} fill="green.600" />
                </Link>
              ) : (
                <Tooltip label={result?.toString()}>
                  <span>
                    <Icon as={HiExclamationTriangle} fill="orange.600" />
                  </span>
                </Tooltip>
              )}
            </>
          );
        },
      },
    ),
  ];

  const router = useRouter();

  useEffect(() => {
    if (appRuns.data) setData(appRuns.data);
  }, [appRuns.data]);

  const tableInstance = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      maxSize: 300,
      minSize: 30,
    },
  });

  const { getHeaderGroups, getRowModel } = tableInstance;
  const rows = getRowModel().rows;

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
        <Table>
          <Thead>
            {getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <>
                    <Th
                      key={header.id}
                      fontWeight="normal"
                      fontSize="sm"
                      textTransform="none"
                      _notFirst={{ pl: 0 }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Th>
                  </>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody color="gray.600" fontSize="sm">
            {appRuns.data && appRuns.data.length > 0 ? (
              rows.map((row, i) => {
                return (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell, j) => {
                      // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
                      return (
                        <Td
                          key={cell.id}
                          style={{ whiteSpace: 'nowrap' }}
                          fontWeight={
                            cell.column.columnDef.id === 'date'
                              ? 'semibold'
                              : 'normal'
                          }
                          isTruncated
                          _notFirst={{ pl: 0 }}
                        >
                          {cell.column.columnDef.id === 'date' &&
                          cell.getValue() ===
                            rows[i - 1]?.getVisibleCells()[j]?.getValue() ? (
                            <></>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
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
      <Drawer isOpen={isOpen} onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader fontSize={'md'}>{modalHeading}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <Heading fontSize="md" mb="4">
              Inputs
            </Heading>
            <JSONViewer value={modalValue} options={{ readOnly: true }} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </HStack>
  );
};

export default HistoryTab;
