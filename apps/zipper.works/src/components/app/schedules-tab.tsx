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
  Switch,
} from '@chakra-ui/react';
import cronstrue from 'cronstrue';
import { useState } from 'react';
import { trpc } from '~/utils/trpc';
import { FiPlusSquare, FiTrash } from 'react-icons/fi';
import { InputParam } from '@zipper/types';
import {
  AddScheduleModal,
  AddScheduleModalProps,
  NewSchedule,
} from './add-schedule-modal';

const tableHeaderStyles: ChakraProps = {
  fontWeight: 'normal',
  fontSize: 'sm',
  textTransform: 'none',
  px: 0,
  pt: 2,
  pb: 3,
};

const tableDataStyles: ChakraProps = {
  p: 4,
  pl: 0,
};

type SchedulesTabProps = {
  appId: string;
  inputParams: InputParam[];
};

const SchedulesTab: React.FC<SchedulesTabProps> = ({ appId, inputParams }) => {
  const utils = trpc.useContext();
  const [newSchedules, setNewSchedules] = useState<NewSchedule[]>([]);
  const existingSchedules = trpc.useQuery(['schedule.all', { appId }]);

  const addSchedule = trpc.useMutation('schedule.add', {
    async onSuccess({ crontab }) {
      await utils.invalidateQueries(['schedule.all', { appId }]);
      const remainingNewSchedules = newSchedules.filter(
        (s) => s.crontab !== crontab,
      );
      setNewSchedules(remainingNewSchedules);
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
    { crontab, inputs },
    resetForm,
  ) => {
    addSchedule.mutate(
      {
        appId,
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
          Apps can be run on an automatic schedule. You can add scheduled runs
          using cron syntax.
        </Text>
      </VStack>
      <VStack flex={3} alignItems="stretch" spacing={0}>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th {...tableHeaderStyles}>Schedule</Th>
                <Th {...tableHeaderStyles}>Cron Expression</Th>
                <Th {...tableHeaderStyles}>Inputs</Th>
                <Th {...tableHeaderStyles} w={0}></Th>
              </Tr>
            </Thead>
            <Tbody color="gray.900" fontSize="sm">
              {(existingSchedules.data?.length ?? 0) > 0 ? (
                existingSchedules.data?.map((s) => {
                  console.log(s);
                  return (
                    <Tr>
                      <Td {...tableDataStyles}>
                        <HStack spacing={0} gap={2}>
                          <Switch
                            colorScheme="purple"
                            // TODO make the isChecked value based on fetched data
                            isChecked={true}
                            // ml="auto"
                          />
                          <Text>{cronstrue.toString(s.crontab)}</Text>
                        </HStack>
                      </Td>
                      <Td {...tableDataStyles}>{s.crontab}</Td>
                      <Td {...tableDataStyles} maxW="20%">
                        {JSON.stringify(s.inputs)}
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
                  <Td colSpan={3}>
                    You don't have any scheduled runs for this app. Create one
                    to get started.
                  </Td>
                </Tr>
              )}
            </Tbody>
            <Tfoot>
              <Tr>
                <Td {...tableDataStyles} py={3} colSpan={3}>
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
        inputParams={inputParams}
        onClose={onCloseAdd}
        onCreate={onCreateSchedule}
      />
    </HStack>
  );
};

export default SchedulesTab;
