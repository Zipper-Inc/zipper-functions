import {
  Heading,
  VStack,
  Box,
  Text,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Divider,
} from '@chakra-ui/react';

import { trpc } from '~/utils/trpc';

type Props = {
  appId: string;
};

const RunsTab: React.FC<Props> = ({ appId }) => {
  const appRunsQuery = trpc.useQuery(['appRun.all', { appId, limit: 10 }]);

  return (
    <>
      <Heading as="h6" pb="4" fontWeight={400}>
        Recent Runs
      </Heading>
      <VStack align={'start'}>
        <>
          <Box mb={4} w="full">
            <Text mb="4">This is a list of recent runs for this app.</Text>
            <Divider my="4" />
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Run at</Th>
                    <Th>Scheduled</Th>
                    <Th>Successful</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {appRunsQuery.data ? (
                    appRunsQuery.data.map((appRun) => {
                      return (
                        <Tr key={appRun.id}>
                          <Td>
                            {new Intl.DateTimeFormat('en-GB', {
                              dateStyle: 'short',
                              timeStyle: 'long',
                            }).format(appRun.createdAt)}
                          </Td>
                          <Td>{appRun.scheduled ? 'Yes' : 'No'}</Td>
                          <Td>{appRun.success ? 'Yes' : 'No'}</Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td>No runs yet. Run the app to see it here.</Td>
                      <Td />
                      <Td />
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </>
      </VStack>
    </>
  );
};

export default RunsTab;
