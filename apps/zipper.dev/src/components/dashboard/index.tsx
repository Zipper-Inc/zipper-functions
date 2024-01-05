import { RouterOutputs } from '~/utils/trpc';
import { api as trpc } from '~/server/react';
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
  IconButton,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { CreateAppForm } from './create-app-form';
import NextLink from 'next/link';

import { DataTable } from './table';
import {
  SortingState,
  createColumnHelper,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  PiPlusBold,
  PiUser,
  PiBuildings,
  PiLockSimpleOpen,
  PiLockSimple,
} from 'react-icons/pi';
import { AppOwner, useAppOwner } from '~/hooks/use-app-owner';
import { EmptySlate } from './empty-slate';
import { ResourceOwnerType } from '@zipper/types';
import { BLUE, TabButton, WHITE } from '@zipper/ui';
import ManageMembers from './members';
import OrganizationSettings from './organization-settings';
import UserSettings from './user-settings';
import AppAvatar from '../app-avatar';
import { useOrganization } from '~/hooks/use-organization';
import { getEditAppletLink } from '@zipper/utils';
import Carousel from 'nuka-carousel';
import { FiArrowRight } from 'react-icons/fi';

type _App = Unpack<RouterOutputs['app']['byAuthedUser']>;
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
          <Box w={16} h={16} minW={16} minH={16}>
            <AppAvatar nameOrSlug={slug} />
          </Box>
          <VStack align={'start'}>
            <HStack align="center">
              <Link
                fontSize={'lg'}
                fontWeight={600}
                display="flex"
                href={getEditAppletLink(resourceOwner.slug, slug)}
                gap={2}
              >
                {getValue()}
                <Tooltip
                  colorScheme="blue"
                  backgroundColor={BLUE}
                  color={WHITE}
                  placement="right"
                  label={isPrivate ? 'Private code' : 'Open-source'}
                >
                  <Text color={BLUE}>
                    {isPrivate ? <PiLockSimple /> : <PiLockSimpleOpen />}
                  </Text>
                </Tooltip>
              </Link>
            </HStack>
            <Tooltip label={description} openDelay={800}>
              <Text
                color="fg.500"
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
              <PiUser />
              <Text>You</Text>
            </HStack>
          ) : (
            <HStack>
              <Icon as={PiBuildings} />
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
          <HStack gap={2}>
            {createdByInfo.resourceOwnerType === ResourceOwnerType.User ? (
              <PiUser />
            ) : (
              <PiBuildings />
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
  columnHelper.accessor('slug', {
    cell: (info) => info.getValue(),
  }),
];

const emptyApps: App[] = [];

export function Dashboard() {
  const [tabIndex, setTabIndex] = useState(0);
  const { organization } = useOrganization();
  const [appSearchTerm, setAppSearchTerm] = useState('');

  const appQuery = trpc.app.byAuthedUser.useQuery({
    filterByOrganization: !appSearchTerm,
  });

  const galleryApps = trpc.app.allApproved.useQuery({
    amount: 6,
  });

  const { onOpen, isOpen, onClose } = useDisclosure();
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    description: false,
    owner: false,
    slug: false,
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
      slug: false,
    });
  }, [appSearchTerm]);

  return (
    <>
      <VStack
        flex={1}
        paddingX={{ base: 4, md: 10 }}
        alignItems="stretch"
        spacing={0}
      >
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
            borderColor={'fg.100'}
            p={1}
            pb={4}
            mb={2}
            pt={3}
            color="fg.500"
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
                <VStack flex={1} minW={320} alignItems="stretch">
                  <HStack pb="4">
                    <Heading as="h6" fontWeight={400}>
                      Applets
                    </Heading>
                  </HStack>
                  <Text color="fg.600" mb="4">
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
                  <VStack flex={3} w="full" overflow="hidden">
                    <HStack w="full" spacing={4} pb="4">
                      <Input
                        placeholder="Search applets (name, slug or description)"
                        value={appSearchTerm}
                        onChange={(e) => setAppSearchTerm(e.target.value)}
                      />
                      <Button
                        variant="solid"
                        colorScheme="purple"
                        fontWeight="medium"
                        fontSize="sm"
                        px={6}
                        onClick={onOpen}
                        leftIcon={<PiPlusBold />}
                      >
                        Create Applet
                      </Button>
                    </HStack>

                    {appQuery.isLoading && (
                      <Center>
                        <Spinner color="purple.700" />
                      </Center>
                    )}

                    {!appQuery.isLoading && apps && apps.length > 0 && (
                      <Flex direction="column" gap={32} w="full">
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

                        {apps.length <= 3 && (
                          <Flex direction="column" w="full" gap={4}>
                            <Heading
                              size="md"
                              fontWeight="semibold"
                              color="fg.700"
                            >
                              Looking for inspiration?
                            </Heading>

                            <Flex
                              direction="column"
                              display={{ base: 'none', md: 'flex' }}
                              gap={4}
                              w="calc(100% + 24px)"
                              marginLeft={-3}
                            >
                              <Carousel
                                cellSpacing={24}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                }}
                                slidesToShow={3}
                                wrapAround
                                renderBottomCenterControls={() => <></>}
                                renderCenterLeftControls={() => <></>}
                                renderCenterRightControls={(ctrl) => (
                                  <IconButton
                                    variant="outline"
                                    bg="bgColor"
                                    border="1px"
                                    borderColor="fg.200"
                                    _hover={{
                                      opacity: '100%',
                                      borderColor: 'fg.500',
                                    }}
                                    aria-label="Next Slide"
                                    onClick={ctrl.nextSlide}
                                    icon={<FiArrowRight />}
                                  />
                                )}
                              >
                                {(galleryApps.data || []).map((app) => (
                                  <HStack
                                    minH={40}
                                    h="full"
                                    as={NextLink}
                                    href={`/gallery/${app.resourceOwner.slug}/${app.slug}`}
                                    align="flex-start"
                                    textDecoration="none"
                                    transition="all .2s ease-in-out"
                                    _hover={{
                                      borderColor: 'fg.500',
                                    }}
                                    key={app.id}
                                    gap={3}
                                    border="1px"
                                    p={5}
                                    borderColor="fg.200"
                                  >
                                    <Box as="figure" w={10} h={10}>
                                      <AppAvatar nameOrSlug={app.slug} />
                                    </Box>
                                    <Flex direction="column" h="full" flex={1}>
                                      <Box h="50%">
                                        <Heading size="sm" color="fg.700">
                                          {app.name ?? app.slug}
                                        </Heading>
                                        <Text fontSize="sm">
                                          By {app.resourceOwner.slug}
                                        </Text>
                                      </Box>

                                      <Text color="fg.500" fontSize="sm">
                                        {app.description}
                                      </Text>
                                    </Flex>
                                  </HStack>
                                ))}
                              </Carousel>
                            </Flex>

                            <Text
                              as={Link}
                              href="/gallery"
                              color="primary"
                              display="flex"
                              alignItems="center"
                              gap={1}
                            >
                              View more in the applet gallery
                              <FiArrowRight size={20} />
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                    )}

                    {appQuery.isSuccess && apps && apps.length === 0 && (
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
