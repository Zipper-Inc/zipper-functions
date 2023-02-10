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
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import DefaultGrid from '~/components/default-grid';
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { CreateAppModal } from './create-app-modal';

import { FiPlus } from 'react-icons/fi';
import { DataTable } from './table';
import { createColumnHelper } from '@tanstack/react-table';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import router from 'next/router';

type AppOwner = { name: string; type: 'user' | 'org' };
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
          {isPrivate ? <LockIcon /> : <UnlockIcon />}
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
  }),
  columnHelper.accessor('owner.name', {
    cell: (info) => info.getValue(),
    header: 'Owner',
  }),
];

const emptyApps: App[] = [];

export function Dashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const appQuery = trpc.useQuery(['app.byAuthedUser']);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [displayedApps, setDisplayedApps] = useState(appQuery.data);
  const [isCreateAppModalOpen, setCreateAppModalOpen] = useState(false);
  const { organizationList } = useOrganizationList();

  const getAppOwner = (app: _App): AppOwner => {
    if (
      app.resourceOwner.resourceOwnerId === user?.id ||
      app.createdById === user?.id
    ) {
      return { name: 'You', type: 'user' };
    }
    const orgName =
      organizationList?.find(
        ({ organization }) =>
          organization.id === app.resourceOwner.resourceOwnerId,
      )?.organization.name ?? '';
    return { name: orgName, type: 'org' };
  };

  useEffect(() => {
    appQuery.refetch();
  }, [organization]);

  useEffect(() => {
    const search = appSearchTerm.trim();
    if (search) {
      const filteredApps = appQuery.data?.filter(
        ({ name, slug, description }) => {
          const searchPattern = RegExp(search, 'gi');
          return (
            searchPattern.test(name ?? slug) ||
            searchPattern.test(description ?? '')
          );
        },
      );
      setDisplayedApps(filteredApps);
    } else if (displayedApps != appQuery.data) {
      setDisplayedApps(appQuery.data);
    }
  }, [appSearchTerm, appQuery.data]);

  const data = prepareAppsData(displayedApps ?? emptyApps, getAppOwner);

  return (
    <>
      <DefaultGrid>
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
                data={data}
                isEmpty={!appQuery.isLoading && !appQuery.data}
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
