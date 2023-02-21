import { inferQueryOutput, trpc } from '~/utils/trpc';
import {
  GridItem,
  TableContainer,
  Text,
  VStack,
  Heading,
  Button,
  Flex,
  Icon,
  Input,
  HStack,
  Link,
  Tooltip,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import DefaultGrid from '~/components/default-grid';
import { useOrganization } from '@clerk/nextjs';
import { CreateAppModal } from './create-app-modal';

import { FiPlus } from 'react-icons/fi';
import { DataTable } from './table';
import {
  DeepKeys,
  SortingState,
  createColumnHelper,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import router from 'next/router';
import { HiBuildingOffice, HiUser } from 'react-icons/hi2';
import { AppOwner, useAppOwner } from '~/hooks/use-app-owner';

type _App = Unpack<inferQueryOutput<'app.byAuthedUser'>>;
type App = _App & {
  owner: AppOwner;
  updatedAt: Date;
};

const prepareAppsData = (
  apps: _App[],
  getAppOwner: (app: _App) => AppOwner,
) => {
  return apps.map((app): App => {
    const { createdAt, updatedAt, name, slug } = app;
    const lastUpdatedAt = updatedAt || createdAt;
    const owner = getAppOwner(app);

    return {
      ...app,
      updatedAt: lastUpdatedAt,
      name: name || slug,
      owner,
    };
  });
};

const columnHelper = createColumnHelper<App>();

const columns = [
  columnHelper.accessor('name', {
    cell: ({
      getValue,
      row: {
        original: { isPrivate, resourceOwner, slug, description },
      },
    }) => (
      <VStack align={'start'} py="2">
        <HStack>
          <Tooltip
            placement="top"
            label={isPrivate ? 'Private' : 'Public'}
            textColor="gray.100"
            backgroundColor="purple.500"
          >
            {isPrivate ? <LockIcon /> : <UnlockIcon />}
          </Tooltip>
          <Link
            fontSize={'md'}
            fontWeight={600}
            onClick={() =>
              router.push(`/${resourceOwner.slug}/${slug}/edit/main.ts`)
            }
          >
            {getValue()}
          </Link>
        </HStack>
        <Text>{description}</Text>
      </VStack>
    ),
    header: 'App Name',
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) =>
      new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'short',
      }).format(info.getValue()),
    header: 'Last Updated',
    enableGlobalFilter: false,
  }),
  columnHelper.accessor('owner.name', {
    cell: (info) => (
      <HStack>
        {info.row.original.owner.type === 'user' ? (
          <HiUser />
        ) : (
          <HiBuildingOffice />
        )}
        <Text>{info.getValue()}</Text>
      </HStack>
    ),
    header: 'Owner',
    enableGlobalFilter: false,
  }),
  columnHelper.accessor('description', {
    cell: (info) => info.getValue(),
    header: 'Description',
  }),
];

const emptyApps: App[] = [];

export function Dashboard() {
  const { organization } = useOrganization();
  const appQuery = trpc.useQuery(['app.byAuthedUser']);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [isCreateAppModalOpen, setCreateAppModalOpen] = useState(false);
  const [columnVisibility] = useState<Partial<Record<DeepKeys<App>, boolean>>>({
    description: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { getAppOwner } = useAppOwner();

  const apps = useMemo(
    () =>
      appQuery.data ? prepareAppsData(appQuery.data, getAppOwner) : emptyApps,
    [appQuery.data],
  );

  useEffect(() => {
    appQuery.refetch();
  }, [organization]);

  return (
    <>
      <DefaultGrid flex={1} maxW="full">
        <GridItem colSpan={12}>
          <VStack align="start" w="full">
            <Flex w="full" align="center" h="20" px="4">
              <Heading size="md" flexGrow={1}>
                Your Apps
              </Heading>
              <Button
                type="button"
                paddingX={4}
                variant="solid"
                colorScheme="purple"
                textColor="gray.100"
                fontSize="sm"
                onClick={async () => {
                  setCreateAppModalOpen(true);
                }}
              >
                <Icon as={FiPlus} mr="2"></Icon>
                Create new app
              </Button>
            </Flex>
            <Input
              placeholder="Search app (name, slug or description)"
              value={appSearchTerm}
              onChange={(e) => setAppSearchTerm(e.target.value)}
            />
            <TableContainer w="full">
              <DataTable
                columns={columns}
                data={apps}
                isEmpty={!appQuery.isLoading && !appQuery.data}
                setGlobalFilter={setAppSearchTerm}
                onSortingChange={setSorting}
                onGlobalFilterChange={setAppSearchTerm}
                globalFilterFn="includesString"
                getSortedRowModel={getSortedRowModel()}
                getFilteredRowModel={getFilteredRowModel()}
                state={{
                  globalFilter: appSearchTerm,
                  columnVisibility,
                  sorting,
                }}
              />
            </TableContainer>
          </VStack>
        </GridItem>
      </DefaultGrid>
      <CreateAppModal
        isOpen={isCreateAppModalOpen}
        onClose={() => setCreateAppModalOpen(false)}
      />
    </>
  );
}
