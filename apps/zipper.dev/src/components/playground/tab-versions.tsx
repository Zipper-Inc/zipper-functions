import { useEffect, useRef, useState } from 'react';
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
  Heading,
  VStack,
  Flex,
  Spinner,
  Link,
  Button,
  IconButton,
  Tooltip,
  Badge,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { User, Version } from '@prisma/client';
import { getAppVersionFromHash } from '~/utils/hashing';
import { getAppLink } from '@zipper/utils';
import {
  PiArrowCounterClockwiseBold,
  PiRocketLaunchBold,
} from 'react-icons/pi';
import { useRouter } from 'next/router';
import { Avatar } from '../avatar';
import { TITLE_COLUMN_MIN_WIDTH } from './constants';

type VersionsTabProps = {
  appId: string;
  slug: string;
};

const VersionsTab: React.FC<VersionsTabProps> = ({ appId, slug }) => {
  const versions = trpc.version.all.useQuery({ appId, limit: 100 });
  const context = trpc.useContext();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);

  const columnHelper = createColumnHelper<
    Version & {
      user: User;
      isCurrentlyPublished: boolean;
      isCurrentlyPlayground: boolean;
    }
  >();

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
      },
    ),
    //created by
    columnHelper.accessor(
      (row) => {
        return `${getAppVersionFromHash(row.hash) || ''}`;
      },
      {
        id: 'version',
        size: 100,
        header: 'Version',
        cell: ({
          getValue,
          row: {
            original: { isCurrentlyPublished, isCurrentlyPlayground },
          },
        }) => {
          return (
            <HStack spacing="5">
              <Link
                href={`${
                  process.env.NODE_ENV === 'production' ? 'https://' : 'http://'
                }${getAppLink(slug)}/@${getValue()}`}
              >
                {getValue()}
              </Link>
              {isCurrentlyPublished && (
                <Badge colorScheme="green">Published</Badge>
              )}

              {isCurrentlyPlayground && <Badge>Editor</Badge>}
            </HStack>
          );
        },
      },
    ),
    //created by
    columnHelper.accessor(
      (row) => {
        return `${row.user?.name || ''}`;
      },
      {
        id: 'user',
        size: 100,
        header: 'Created by',
        cell: ({ getValue, row: { original: version } }) => {
          return (
            <HStack>
              {version.user?.image && (
                <Avatar src={version.user?.image} size="xs" />
              )}
              <Text color={version.user ? 'fg.600' : 'fg.400'}>
                {getValue()}
              </Text>
              ;
            </HStack>
          );
        },
      },
    ),
    // actions
    columnHelper.accessor(
      (row) => {
        return '';
      },
      {
        id: 'actions',
        size: 100,
        header: '',
        cell: ({
          row: {
            original: { isCurrentlyPublished, isCurrentlyPlayground, hash },
          },
        }) => {
          const { isOpen, onOpen, onClose } = useDisclosure();
          const cancelRef =
            useRef() as React.MutableRefObject<HTMLButtonElement>;
          const restoreMutation = trpc.version.restore.useMutation({
            onSuccess: () => {
              context.version.all.invalidate({ appId, limit: 100 });
              context.app.byId.invalidate({ id: appId });
              context.app.byResourceOwnerAndAppSlugs.invalidate({
                appSlug: slug,
                resourceOwnerSlug: router.query['resource-owner'] as string,
              });
            },
          });
          const promoteMutation = trpc.version.promote.useMutation({
            onSuccess: () => {
              context.version.all.invalidate({ appId, limit: 100 });
              context.app.byId.invalidate({ id: appId });
              context.app.byResourceOwnerAndAppSlugs.invalidate({
                appSlug: slug,
                resourceOwnerSlug: router.query['resource-owner'] as string,
              });
            },
          });

          return (
            <>
              <HStack spacing="5">
                <Tooltip
                  label={
                    isCurrentlyPublished ? 'Currently Published' : 'Publish'
                  }
                >
                  <IconButton
                    aria-label="publish"
                    variant="outline"
                    colorScheme="purple"
                    isDisabled={isCurrentlyPublished}
                    fontSize="sm"
                    icon={<PiRocketLaunchBold />}
                    onClick={async () =>
                      await promoteMutation.mutateAsync({
                        appId,
                        version: getAppVersionFromHash(hash)!,
                      })
                    }
                  />
                </Tooltip>
                <Tooltip
                  label={
                    isCurrentlyPlayground ? 'Currently editing' : 'Restore code'
                  }
                >
                  <IconButton
                    aria-label="restore"
                    colorScheme="orange"
                    isDisabled={isCurrentlyPlayground}
                    icon={<PiArrowCounterClockwiseBold />}
                    variant="outline"
                    onClick={onOpen}
                  />
                </Tooltip>
              </HStack>
              <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
              >
                <AlertDialogOverlay>
                  <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                      Restore code?
                    </AlertDialogHeader>

                    <AlertDialogBody>
                      Are you sure? Any unsaved changes will be lost.
                    </AlertDialogBody>

                    <AlertDialogFooter>
                      <Button ref={cancelRef} onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        colorScheme="red"
                        onClick={async () => {
                          await restoreMutation.mutateAsync({
                            appId,
                            version: getAppVersionFromHash(hash)!,
                          });
                          router.reload();
                        }}
                        ml={3}
                      >
                        Restore
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogOverlay>
              </AlertDialog>
            </>
          );
        },
      },
    ),
  ];

  useEffect(() => {
    if (versions.data) setData(versions.data);
  }, [versions.data]);

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
      <VStack
        flex={1}
        alignItems="stretch"
        spacing={0}
        gap={4}
        minW={TITLE_COLUMN_MIN_WIDTH}
      >
        <Heading as="h6" fontWeight={400} flex={1}>
          Code Versions
        </Heading>
        <Text display="inline">
          A history of all the code versions that have been saved and published.
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
          <Tbody color="fg.600" fontSize="sm">
            {versions.data && versions.data.length > 0 ? (
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
                  {versions.isLoading ? (
                    <Spinner color="purple" />
                  ) : (
                    "This app doesn't have any versions yet."
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

export default VersionsTab;
