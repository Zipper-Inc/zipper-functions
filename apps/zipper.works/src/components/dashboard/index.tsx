import { inferQueryOutput, trpc } from '~/utils/trpc';
import {
  GridItem,
  TableContainer,
  Text,
  VStack,
  Button,
  Icon,
  Input,
  HStack,
  Link,
  Tooltip,
  Spinner,
  Center,
  Spacer,
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
import { HiBuildingOffice, HiUser } from 'react-icons/hi2';
import { AppOwner, useAppOwner } from '~/hooks/use-app-owner';
import { EmptySlate } from './empty-slate';
import { ResourceOwnerType } from '@zipper/types';
import OrganizationSwitcher from '../auth/organizationSwitcher';

type _App = Unpack<inferQueryOutput<'app.byAuthedUser'>>;
type App = _App & {
  createdByInfo: AppOwner;
  updatedAt: Date;
};

const prepareAppsData = (
  apps: _App[],
  getAppOwner: (app: _App) => AppOwner,
) => {
  return apps.map((app): App => {
    const { createdAt, updatedAt, name, slug } = app;
    const lastUpdatedAt = updatedAt || createdAt;
    const appOwner = getAppOwner(app);

    return {
      ...app,
      updatedAt: lastUpdatedAt,
      name: name || slug,
      createdByInfo: appOwner,
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
    }) => {
      return (
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
              href={`/${resourceOwner.slug}/${slug}/edit/main.ts`}
            >
              {getValue()}
            </Link>
          </HStack>
          <Text>{description}</Text>
        </VStack>
      );
    },
    header: 'Applet Name',
  }),
  columnHelper.accessor('createdByInfo.createdByAuthedUser', {
    id: 'createdBy',
    cell: (info) => {
      const createdByInfo = info.row.original.createdByInfo;
      return (
        <>
          {info.getValue() ? (
            <HStack>
              <HiUser />
              <Text>You</Text>
            </HStack>
          ) : (
            <HStack>
              <Icon as={HiBuildingOffice} />
              <Text>{createdByInfo.resourceOwnerName}</Text>
            </HStack>
          )}
        </>
      );
    },
    header: 'Created by',
    enableGlobalFilter: false,
    size: 52,
  }),
  columnHelper.accessor('resourceOwner.slug', {
    id: 'owner',
    cell: (info) => {
      const createdByInfo = info.row.original.createdByInfo;

      return (
        <>
          <HStack>
            {createdByInfo.resourceOwnerType === ResourceOwnerType.User ? (
              <Icon as={HiUser} />
            ) : (
              <Icon as={HiBuildingOffice} />
            )}
            <Text>{info.getValue()}</Text>
          </HStack>
        </>
      );
    },
    header: 'Owner',
    size: 52,
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) =>
      new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'short',
      }).format(info.getValue()),
    header: 'Last Updated',
    enableGlobalFilter: false,
    size: 52,
  }),
  columnHelper.accessor('description', {
    cell: (info) => info.getValue(),
    header: 'Description',
  }),
];

const emptyApps: App[] = [];

export function Dashboard() {
  const { organization } = useOrganization();
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const appQuery = trpc.useQuery([
    'app.byAuthedUser',
    { filterByOrganization: !appSearchTerm },
  ]);
  const [isCreateAppModalOpen, setCreateAppModalOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<
    Partial<Record<DeepKeys<App>, boolean>>
  >({
    description: false,
    owner: false,
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

  useEffect(() => {
    setColumnVisibility({
      description: false,
      owner: !!appSearchTerm,
      createdBy: !appSearchTerm,
    });
  });

  if (appQuery.isLoading) {
    return (
      <Center>
        <Spinner color="purple.700" />
      </Center>
    );
  }

  return (
    <>
      <DefaultGrid flex={1} w="full" mb="10">
        <GridItem colSpan={12}>
          <VStack align="start" w="full">
            <HStack w="full">
              {appSearchTerm ? (
                <VStack align="start">
                  <Text fontSize="3xl" fontWeight="medium" p="0" m="-0.5">
                    Search
                  </Text>
                  <Text color="gray.600">
                    Searching applets across all your workspaces
                  </Text>
                </VStack>
              ) : (
                <VStack align="start">
                  <OrganizationSwitcher
                    fontSize="3xl"
                    fontWeight="medium"
                    border="none"
                    p="0"
                    variant={'unstyled'}
                    display="flex"
                  />
                  <Text color="gray.600">
                    {organization
                      ? 'Applets that you and other organization members have created within this workspace.'
                      : "Applets that you've created or that have been shared with you outside an organization workspace."}
                  </Text>
                </VStack>
              )}
              <Spacer flexGrow={1} />
              <Button
                type="button"
                pl={4}
                pr={6}
                variant="solid"
                colorScheme="purple"
                textColor="gray.100"
                fontSize="sm"
                onClick={async () => {
                  setCreateAppModalOpen(true);
                }}
              >
                <Icon as={FiPlus} mr="2"></Icon>
                Create Applet
              </Button>
            </HStack>
            <HStack w="full" align="center" h="20">
              <Input
                placeholder="Search applets (name, slug or description)"
                value={appSearchTerm}
                onChange={(e) => setAppSearchTerm(e.target.value)}
              />
            </HStack>
            {apps && apps.length > 0 ? (
              <>
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
              </>
            ) : (
              <EmptySlate
                organization={organization}
                onCreateButtonClick={() => setCreateAppModalOpen(true)}
              />
            )}
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
