import { inferQueryOutput, trpc } from '~/utils/trpc';
import {
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
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  Heading,
  Box,
  Flex,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { CreateAppForm } from './create-app-form';

import { FiPlus } from 'react-icons/fi';
import { DataTable } from './table';
import {
  SortingState,
  createColumnHelper,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  HiBuildingOffice,
  HiOutlineLockOpen,
  HiOutlineLockClosed,
  HiUser,
} from 'react-icons/hi2';
import { AppOwner, useAppOwner } from '~/hooks/use-app-owner';
import { EmptySlate } from './empty-slate';
import { ResourceOwnerType } from '@zipper/types';
import { TabButton } from '@zipper/ui';
import ManageMembers from './members';
import OrganizationSettings from './organization-settings';
import UserSettings from './user-settings';
import AppAvatar from '../app-avatar';
import { useOrganization } from '~/hooks/use-organization';
import { getEditAppletLink } from '@zipper/utils';

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
        <HStack align="center" spacing={4}>
          <Box clipPath={'circle(32px)'} w="12">
            <AppAvatar nameOrSlug={slug} />
          </Box>
          <VStack align={'start'}>
            <HStack>
              <Link
                fontSize={'lg'}
                fontWeight={600}
                href={getEditAppletLink(resourceOwner.slug, slug)}
              >
                {getValue()}
              </Link>
              <Tooltip
                placement="top"
                label={isPrivate ? 'Private code' : 'Public code'}
                textColor="gray.100"
                backgroundColor="purple.500"
              >
                <span>
                  {isPrivate ? (
                    <Icon as={HiOutlineLockClosed} />
                  ) : (
                    <Icon as={HiOutlineLockOpen} />
                  )}
                </span>
              </Tooltip>
            </HStack>
            <Tooltip label={description} openDelay={800}>
              <Text
                color="gray.500"
                fontSize="sm"
                noOfLines={1}
                whiteSpace="pre-line"
              >
                {description}
              </Text>
            </Tooltip>
          </VStack>
        </HStack>
      );
    },
    header: 'Name',
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
  const [tabIndex, setTabIndex] = useState(0);
  const { organization } = useOrganization();
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const appQuery = trpc.useQuery([
    'app.byAuthedUser',
    { filterByOrganization: !appSearchTerm },
  ]);

  const { onOpen, isOpen, onClose } = useDisclosure();
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    description: false,
    owner: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { getAppOwner } = useAppOwner();

  const tabs = organization
    ? ['Applets', 'People', 'Settings']
    : ['Applets', 'Settings'];

  const apps = useMemo(
    () =>
      appQuery.data ? prepareAppsData(appQuery.data, getAppOwner) : emptyApps,
    [appQuery.data],
  );

  useEffect(() => {
    appQuery.refetch();
    if (!organization && tabIndex > 1) setTabIndex(0);
  }, [organization]);

  useEffect(() => {
    setColumnVisibility({
      description: false,
      owner: !!appSearchTerm,
      createdBy: !appSearchTerm,
    });
  }, [appSearchTerm]);

  if (appQuery.isLoading) {
    return (
      <Center>
        <Spinner color="purple.700" />
      </Center>
    );
  }

  return (
    <>
      <VStack flex={1} paddingX={10} alignItems="stretch" spacing={0}>
        <Tabs
          colorScheme="purple"
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="stretch"
          isLazy
          w="full"
          index={tabIndex}
          onChange={(index) => setTabIndex(index)}
        >
          <TabList
            borderBottom="1px solid"
            borderColor={'gray.100'}
            p={1}
            pb={4}
            mb={2}
            pt={3}
            color="gray.500"
            gap={4}
            justifyContent="space-between"
            overflowX="auto"
          >
            <HStack spacing={2} w="full">
              {tabs.map((tab) => {
                return <TabButton key={tab} title={tab} />;
              })}
            </HStack>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Flex
                flexDir={{ base: 'column', xl: 'row' }}
                flex={1}
                alignItems="start"
                gap={{ base: 10, xl: 16 }}
              >
                <VStack flex={1} alignItems="stretch">
                  <HStack pb="4">
                    <Heading as="h6" fontWeight={400}>
                      Applets
                    </Heading>
                  </HStack>
                  <Text color="gray.600" mb="4">
                    {organization
                      ? 'Applets that you and other organization members have created within this workspace.'
                      : "Applets that you've created or that have been shared with you outside an organization workspace."}
                  </Text>
                </VStack>
                {isOpen ? (
                  <VStack flex={3} align="start">
                    <CreateAppForm onClose={onClose} />
                  </VStack>
                ) : (
                  <VStack flex={3}>
                    <HStack w="full" spacing={4} pb="4">
                      <Input
                        placeholder="Search applets (name, slug or description)"
                        value={appSearchTerm}
                        onChange={(e) => setAppSearchTerm(e.target.value)}
                      />
                      <Button
                        type="button"
                        pl={4}
                        pr={6}
                        variant="solid"
                        colorScheme="purple"
                        textColor="gray.100"
                        fontSize="sm"
                        onClick={onOpen}
                      >
                        <Icon as={FiPlus} mr="2" />
                        Create Applet
                      </Button>
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
                        onCreateButtonClick={onOpen}
                      />
                    )}
                  </VStack>
                )}
              </Flex>
            </TabPanel>
            {organization && (
              <TabPanel>
                <ManageMembers />
              </TabPanel>
            )}
            <TabPanel>
              {organization ? <OrganizationSettings /> : <UserSettings />}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </>
  );
}
