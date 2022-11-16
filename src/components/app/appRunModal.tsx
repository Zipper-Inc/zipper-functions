import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
import { useEffect } from 'react';

import { trpc } from '~/utils/trpc';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const AppRunModal: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const appRunsQuery = trpc.useQuery(['appRun.all', { appId, limit: 10 }]);

  useEffect(() => {
    if (isOpen) {
      appRunsQuery.refetch();
    }
  }, [isOpen]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
        }}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Recent Runs</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align={'start'}>
              <>
                <Box mb={4} w="full">
                  <Text mb="4">
                    This is a list of recent runs for this app.
                  </Text>
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
          </ModalBody>

          <ModalFooter mt={4}>
            <Button
              type="submit"
              colorScheme="blue"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AppRunModal;
