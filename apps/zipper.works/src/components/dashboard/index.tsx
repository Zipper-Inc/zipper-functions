import { inferQueryOutput, trpc } from '~/utils/trpc';
import {
  GridItem,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Heading,
  Button,
  Flex,
  Icon,
  Input,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import DefaultGrid from '~/components/default-grid';
import { FiPlus } from 'react-icons/fi';
import { useOrganization, useOrganizations } from '@clerk/nextjs';
import { OrganizationResource } from '@clerk/types';
import { DashboardAppTableRows } from './app-table-rows';
import { CreateAppModal } from './create-app-modal';

const useAppOrganizations = (
  apps: inferQueryOutput<'app.byAuthedUser'> | undefined,
) => {
  const { getOrganization } = useOrganizations();
  const [organizations, setOrganizations] = useState<
    Record<string, OrganizationResource>
  >({});

  useEffect(() => {
    if (typeof getOrganization === 'function') {
      const orgIds = (apps ?? []).reduce((ids, { organizationId }) => {
        if (organizationId && !ids.includes(organizationId)) {
          return ids.concat(organizationId);
        }
        return ids;
      }, [] as string[]);

      Promise.all(orgIds.map(async (id) => getOrganization(id))).then(
        (data) => {
          const orgs = data.reduce((orgs, cur) => {
            if (cur) {
              return { ...orgs, [cur.id]: cur };
            }
            return orgs;
          }, {} as typeof organizations);
          setOrganizations(orgs);
        },
      );
    }
  }, [getOrganization, apps]);

  return organizations;
};

export function Dashboard() {
  const { organization } = useOrganization();
  const appQuery = trpc.useQuery(['app.byAuthedUser']);
  const organizations = useAppOrganizations(appQuery.data);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [displayedApps, setDisplayedApps] = useState(appQuery.data);
  const [isCreateAppModalOpen, setCreateAppModalOpen] = useState(false);

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
              <Table size={'sm'}>
                <Thead>
                  <Tr>
                    <Th>App Name</Th>
                    <Th>Last Updated</Th>
                    <Th>Owner</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayedApps && (
                    <DashboardAppTableRows
                      apps={displayedApps}
                      organizations={organizations}
                    />
                  )}
                  {!appQuery.isLoading && !appQuery.data && (
                    <Tr>
                      <Td>
                        You're all out of apps. Probably a good time to create
                        one.
                      </Td>
                      <Td />
                    </Tr>
                  )}
                </Tbody>
              </Table>
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
