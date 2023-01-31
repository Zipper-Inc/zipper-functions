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
  Divider,
  Heading,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import cronstrue from 'cronstrue';
import { useEffect, useState } from 'react';
import { AddIcon } from '@chakra-ui/icons';
import { trpc } from '~/utils/trpc';
import { FiClock, FiTrash, FiX } from 'react-icons/fi';
import { InputParam } from '~/types/input-params';
import InputParamsForm from './input-params-form';

type Props = {
  appId: string;
  inputParams: InputParam[];
};

const SchedulesTab: React.FC<Props> = ({ appId, inputParams }) => {
  const utils = trpc.useContext();
  const { handleSubmit, reset } = useForm();
  const [currentCrontab, setCurrentCrontab] = useState<string>('0 * *  * *');
  const [cronString, setCronString] = useState<string>();
  const [newSchedules, setNewSchedules] = useState<
    { crontab: string; inputs: Record<string, any> }[]
  >([]);
  const [allSchedules, setAllSchedules] = useState<
    { id?: string; crontab: string; appId?: string }[]
  >([]);

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
  useEffect(() => {
    try {
      if (currentCrontab) {
        const string = cronstrue.toString(currentCrontab, {
          use24HourTimeFormat: true,
        });
        setCronString(string);
      }
    } catch (error: any) {
      console.log(error);
      setCronString(error || 'Invalid cron expression');
    }
  }, [currentCrontab]);

  useEffect(() => {
    setAllSchedules([
      ...(existingSchedules?.data || []),
      ...newSchedules.map((s) => ({
        id: undefined,
        appId,
        crontab: s.crontab,
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
    const addModalForm = useForm();

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <FormProvider {...addModalForm}>
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
                    {...addModalForm.register('crontab')}
                    defaultValue="0 * * * *"
                    onChange={(e) => setCurrentCrontab(e.target.value)}
                  />
                  <FormHelperText>{cronString}</FormHelperText>
                  <Divider mt="4" />
                  <Text size="sm" mt="4" mb="2">
                    Inputs for this scheduled run:
                  </Text>
                  <Box background="gray.200" p="4" borderRadius="4">
                    <InputParamsForm params={inputParams} />
                  </Box>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" onClick={onClose} mr="3">
                Discard
              </Button>
              <Button
                colorScheme="purple"
                type="submit"
                onClick={addModalForm.handleSubmit((data) => {
                  const { crontab, ...inputValues } = data;
                  const allNewSchedules = [
                    ...newSchedules,
                    { crontab, inputs: inputValues },
                  ];
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
        </FormProvider>
      </Modal>
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(() => {
          newSchedules.forEach((s) => {
            addSchedule.mutate({
              appId,
              crontab: s.crontab,
              inputs: s.inputs,
            });
          });
          reset();
        })}
      >
        <Heading as="h6" pb="4" fontWeight={400}>
          Schedules
        </Heading>
        <VStack align={'start'}>
          <>
            <Box mb={4} w="full">
              <Text mb="4">
                Apps can be run on an automatic schedule. You can add scheduled
                runs using cron syntax.
              </Text>
              <List maxWidth="container.sm">
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
                                (ns) => ns.crontab !== s.crontab,
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
                      You don't have any scheduled runs for this app. Create one
                      to get started.
                    </Text>
                  </Box>
                )}
              </List>
            </Box>
          </>
        </VStack>

        <Box>
          <Button variant="outline" mr={3} onClick={onOpenAdd}>
            <AddIcon mr={2} boxSize={3} />
            Add
          </Button>
          {newSchedules.length > 0 && (
            <Button type="submit" colorScheme="purple">
              Save {newSchedules.length > 0 && `(${newSchedules.length} new)`}
            </Button>
          )}
        </Box>
      </form>
      {addModal({ onClose: onCloseAdd, isOpen: isOpenAdd })}
    </>
  );
};

export default SchedulesTab;
