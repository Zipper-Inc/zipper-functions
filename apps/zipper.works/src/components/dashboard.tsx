import { trpc } from '../utils/trpc';
import {
  GridItem,
  HStack,
  Link,
  Table,
  TableContainer,
  Tbody,
  Text,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Heading,
  Button,
  Flex,
  Icon,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import DefaultGrid from '~/components/default-grid';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { FiPlus } from 'react-icons/fi';
import { useOrganization } from '@clerk/nextjs';

export function Dashboard() {
  const router = useRouter();
  const { organization } = useOrganization();
  const appQuery = trpc.useQuery(['app.byAuthedUser']);

  useEffect(() => {
    appQuery.refetch();
  }, [organization]);

  const utils = trpc.useContext();
  const addApp = trpc.useMutation('app.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byAuthedUser']);
    },
  });

  return (
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
                await addApp.mutateAsync();
              }}
            >
              <Icon as={FiPlus} mr="2"></Icon>
              Create new app
            </Button>
          </Flex>
          <TableContainer w="full">
            <Table size={'sm'}>
              <Thead>
                <Tr>
                  <Th>App Name</Th>
                  <Th>Last Updated</Th>
                </Tr>
              </Thead>
              <Tbody>
                {appQuery.data &&
                  appQuery.data.map((app) => {
                    return (
                      <Tr key={app.id}>
                        <Td>
                          <VStack align={'start'} py="2">
                            <HStack>
                              {app.isPrivate ? <LockIcon /> : <UnlockIcon />}
                              <Link
                                fontSize={'md'}
                                fontWeight={600}
                                onClick={() =>
                                  router.push(`/app/${app.id}/edit/main.ts`)
                                }
                              >
                                {app.name || app.slug}
                              </Link>
                            </HStack>
                            <Text>{app.description}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          {new Intl.DateTimeFormat('en-GB', {
                            dateStyle: 'short',
                          }).format(app.updatedAt || app.createdAt)}
                        </Td>
                      </Tr>
                    );
                  })}
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
  );
}
