import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';
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
} from '@chakra-ui/react';
import React from 'react';
import DefaultGrid from '~/components/default-grid';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';

const MyAppsPage: NextPageWithLayout = () => {
  const appQuery = trpc.useQuery(['app.byAuthedUser']);

  return (
    <DefaultGrid>
      <GridItem colSpan={12}>
        <VStack align="start" w="full">
          <Heading size="lg" mb={5}>
            Your Apps
          </Heading>
          <TableContainer w="full">
            <Table size={'sm'}>
              <Thead>
                <Tr>
                  <Th>App Name</Th>
                  <Th>Last Updated</Th>
                </Tr>
              </Thead>
              <Tbody>
                {appQuery.data ? (
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
                                href={`/app/${app.id}/edit`}
                              >
                                {app.name}
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
                  })
                ) : (
                  <Tr>
                    <Td>
                      You're all out of apps. Probably a good time to create one
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
};

export default MyAppsPage;
