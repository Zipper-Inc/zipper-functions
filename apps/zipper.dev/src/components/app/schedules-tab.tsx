import {
  Button,
  VStack,
  useDisclosure,
  HStack,
  IconButton,
  Text,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  ChakraProps,
  Badge,
  useToast,
} from '@chakra-ui/react';
import cronstrue from 'cronstrue';
import { useState } from 'react';
import { trpc } from '~/utils/trpc';
import { FiPlusSquare, FiTrash } from 'react-icons/fi';
import {
  AddScheduleModal,
  AddScheduleModalProps,
  NewSchedule,
} from './add-schedule-modal';
import { Avatar } from '../avatar';

const tableHeaderStyles: ChakraProps = {
  fontWeight: 'normal',
  fontSize: 'sm',
  textTransform: 'none',
  pl: 0,
  pt: 2,
  pb: 3,
  pr: 8,
};

const tableDataStyles: ChakraProps = {
  py: 4,
  pl: 0,
  pr: 10,
};

type SchedulesTabProps = {
  appId: string;
};

const SchedulesTab: React.FC<SchedulesTabProps> = ({ appId }) => {
  const utils = trpc.useContext();
  const [newSchedules, setNewSchedules] = useState<NewSchedule[]>([]);
  const existingSchedules = trpc.useQuery(['schedule.all', { appId }]);
  const toast = useToast();

  const addSchedule = trpc.useMutation('schedule.add', {
    onError({}) {
      toast({
        title: 'Something went wrong...',
        description:
          "Check your cron syntax. We don't run jobs more than once per minute.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    async onSuccess({ crontab }) {
      await utils.invalidateQueries(['schedule.all', { appId }]);
      const remainingNewSchedules = newSchedules.filter(
        (s) => s.crontab !== crontab,
      );
      setNewSchedules(remainingNewSchedules);
      toast({
        title: 'Scheduled job created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const deleteSchedule = trpc.useMutation('schedule.delete', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['schedule.all', { appId }]);
    },
  });

  const {
    isOpen: isOpenAdd,
    onOpen: onOpenAdd,
    onClose: onCloseAdd,
  } = useDisclosure();

  const onCreateSchedule: AddScheduleModalProps['onCreate'] = (
    { filename, crontab, inputs },
    resetForm,
  ) => {
    addSchedule.mutate(
      {
        appId,
        filename,
        crontab,
        inputs,
      },
      {
        onSuccess() {
          onCloseAdd();
          resetForm();
        },
      },
    );
  };

  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack flex={1} alignItems="stretch" spacing={0} gap={4}>
        <Heading as="h6" fontWeight="normal">
          Schedules
        </Heading>
        <Text mb="4">
          Applets can be run on an automatic schedule. You can add scheduled
          runs using cron syntax.
        </Text>
      </VStack>
      <VStack flex={3} alignItems="stretch" spacing={0} overflow="auto">
        <TableContainer flex={1}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th {...tableHeaderStyles}>Schedule</Th>
                <Th {...tableHeaderStyles}>Cron Expression</Th>
                <Th {...tableHeaderStyles}>Script</Th>
                <Th {...tableHeaderStyles}>Run As</Th>
                <Th {...tableHeaderStyles}>Last Run</Th>
                <Th {...tableHeaderStyles} w={0} pr={0}></Th>
              </Tr>
            </Thead>
            <Tbody color="gray.900" fontSize="sm">
              {(existingSchedules.data?.length ?? 0) > 0 ? (
                existingSchedules.data?.map((s) => {
                  const lastRunAt = new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'short',
                    timeStyle: 'long',
                  }).format(s.appRuns[0]?.createdAt);
                  const lastRunSuccessful = s.appRuns[0]?.success;

                  return (
                    <Tr key={s.id}>
                      <Td {...tableDataStyles}>
                        {cronstrue.toString(s.crontab)}
                      </Td>
                      <Td {...tableDataStyles}>{s.crontab}</Td>
                      <Td {...tableDataStyles}>{s.filename}</Td>
                      <Td {...tableDataStyles}>
                        <Avatar userId={s.userId || undefined} size="xs" />
                      </Td>
                      <Td {...tableDataStyles}>
                        {s.appRuns.length > 0 ? (
                          <HStack>
                            <Text color="gray.600" fontSize="xs">
                              {lastRunAt}
                            </Text>
                            <Badge
                              variant="subtle"
                              colorScheme={lastRunSuccessful ? 'green' : 'red'}
                              fontSize="xs"
                            >
                              {lastRunSuccessful ? 'SUCCESSFUL' : 'FAILED'}
                            </Badge>
                          </HStack>
                        ) : (
                          <Text color="gray.600" fontSize="xs">
                            Not run yet
                          </Text>
                        )}
                      </Td>
                      <Td {...tableDataStyles} py={0} pr={0}>
                        <HStack spacing={0} justifyContent="end">
                          <IconButton
                            size="xs"
                            aria-label="delete"
                            variant="ghost"
                            color="gray.500"
                            _hover={{ color: 'red.600', bgColor: 'red.100' }}
                            onClick={() => {
                              if (s.id) {
                                deleteSchedule.mutate({
                                  id: s.id,
                                  appId: appId,
                                });
                              }
                            }}
                          >
                            <FiTrash />
                          </IconButton>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr {...tableDataStyles}>
                  <Td colSpan={6}>
                    You don't have any scheduled runs for this app. Create one
                    to get started.
                  </Td>
                </Tr>
              )}
            </Tbody>
            <Tfoot>
              <Tr>
                <Td {...tableDataStyles} py={3} colSpan={6}>
                  <Button
                    colorScheme="purple"
                    size="sm"
                    variant="ghost"
                    display="flex"
                    gap={4}
                    px={2}
                    onClick={onOpenAdd}
                  >
                    <FiPlusSquare />
                    <Text>Create a new schedule</Text>
                  </Button>
                </Td>
              </Tr>
            </Tfoot>
          </Table>
        </TableContainer>
      </VStack>
      <AddScheduleModal
        isOpen={isOpenAdd}
        onClose={onCloseAdd}
        onCreate={onCreateSchedule}
      />
    </HStack>
  );
};

export default SchedulesTab;
