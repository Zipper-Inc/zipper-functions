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
  Input,
  FormHelperText,
  FormControl,
  FormLabel,
  useDisclosure,
  List,
  HStack,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import cronstrue from 'cronstrue';
import { useEffect, useState } from 'react';
import { AddIcon } from '@chakra-ui/icons';
import { trpc } from '~/utils/trpc';
import { FiClock, FiTrash, FiX } from 'react-icons/fi';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const ScheduleModal: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const utils = trpc.useContext();
  const { register, handleSubmit, reset } = useForm();
  const [cronTab, setCronTab] = useState<string>('0 * *  * *');
  const [cronString, setCronString] = useState<string>();
  const [newSchedules, setNewSchedules] = useState<string[]>([]);
  const [allSchedules, setAllSchedules] = useState<
    { id?: string; crontab: string; appId?: string }[]
  >([]);

  const existingSchedules = trpc.useQuery(['schedule.all', { appId }]);

  const addSchedule = trpc.useMutation('schedule.add', {
    async onSuccess({ crontab }) {
      // refetches posts after a post is added
      const remainingNewSchedules = newSchedules.filter((s) => s !== crontab);
      setNewSchedules(remainingNewSchedules);
      await utils.invalidateQueries(['secret.all', { appId }]);
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

  useEffect(() => {
    if (isOpen) {
      existingSchedules.refetch();
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      if (cronTab) {
        const string = cronstrue.toString(cronTab, {
          use24HourTimeFormat: true,
        });
        setCronString(string);
      }
    } catch (error: any) {
      console.log(error);
      setCronString(error || 'Invalid cron expression');
    }
  }, [cronTab]);

  useEffect(() => {
    setAllSchedules([
      ...(existingSchedules?.data || []),
      ...newSchedules.map((s) => ({
        id: undefined,
        appId,
        crontab: s,
      })),
    ]);
  }, [existingSchedules.data, newSchedules]);

  const addModal = ({
    onClose,
    isOpen,
  }: {
    onClose: VoidFunction;
    isOpen: boolean;
  }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a schedule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align={'start'}>
              <FormControl>
                <FormLabel>Cron expression:</FormLabel>
                <Input
                  size="md"
                  type="text"
                  {...register('cronTab')}
                  defaultValue="* 1 * * *"
                  onChange={(e) => setCronTab(e.target.value)}
                />
                <FormHelperText>{cronString}</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr="3">
              Discard
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              onClick={handleSubmit((data) => {
                const allNewSchedules = [...newSchedules, data.cronTab];
                setNewSchedules(
                  allNewSchedules.filter(
                    (s, i) => allNewSchedules.indexOf(s) === i,
                  ),
                );
                onClose();
              })}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setNewSchedules([]);
          onClose();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <form
            onSubmit={handleSubmit(() => {
              newSchedules.forEach((s) => {
                addSchedule.mutate({
                  appId,
                  crontab: s,
                });
              });
              reset();
            })}
          >
            <ModalHeader>Schedules</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align={'start'}>
                <>
                  <Box mb={4} w="full">
                    <Text mb="4">
                      Apps can be run on an automatic schedule. You can add
                      scheduled runs using cron syntax.
                    </Text>
                    <List>
                      {allSchedules.length > 0 ? (
                        allSchedules.map((s, i) => (
                          <HStack mb="4" key={i}>
                            <FiClock />
                            <Box
                              border="1px solid"
                              borderColor={s.id ? 'gray.300' : 'gray.600'}
                              borderRadius="4px"
                              p={2}
                              my={4}
                              flexGrow={1}
                            >
                              <HStack key={s.id || i} alignItems="start">
                                <Box mt="1"></Box>
                                <VStack alignItems="start">
                                  <Text color={s.id ? 'gray.600' : 'gray.900'}>
                                    {s.crontab}
                                  </Text>
                                  <Text
                                    color={s.id ? 'gray.600' : 'gray.900'}
                                    fontSize="xs"
                                  >
                                    {cronstrue.toString(s.crontab)}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Box>

                            <IconButton
                              variant="ghost"
                              colorScheme="red"
                              aria-label="delete"
                              onClick={() => {
                                if (s.id) {
                                  deleteSchedule.mutate({
                                    id: s.id,
                                    appId: appId,
                                  });
                                } else {
                                  setNewSchedules(
                                    newSchedules.filter(
                                      (ns) => ns !== s.crontab,
                                    ),
                                  );
                                }
                              }}
                            >
                              {s.id ? <FiTrash /> : <FiX />}
                            </IconButton>
                          </HStack>
                        ))
                      ) : (
                        <Box
                          border="1px solid"
                          borderColor="gray.300"
                          borderRadius="4px"
                          p={2}
                          my={4}
                          onClick={onOpenAdd}
                          cursor="pointer"
                        >
                          <Text>
                            You don't have any scheduled runs for this app.
                            Create one to get started.
                          </Text>
                        </Box>
                      )}
                    </List>
                  </Box>
                </>
              </VStack>
            </ModalBody>

            <ModalFooter mt={4}>
              <Button variant="outline" mr={3} onClick={onOpenAdd}>
                <AddIcon mr={2} boxSize={3} />
                Add
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                onClick={() => {
                  onClose();
                }}
              >
                Save {newSchedules.length > 0 && `(${newSchedules.length} new)`}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      {addModal({ onClose: onCloseAdd, isOpen: isOpenAdd })}
    </>
  );
};

export default ScheduleModal;
