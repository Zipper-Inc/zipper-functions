import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  FormHelperText,
  ModalFooter,
  Button,
  Text,
  Select,
  HStack,
} from '@chakra-ui/react';
import { InputParam } from '@zipper/types';
import { FunctionInputs } from '@zipper/ui';
import cronstrue from 'cronstrue';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useUser } from '~/hooks/use-user';
import { parseInputForTypes } from '~/utils/parse-code';
import { useEditorContext } from '../context/editor-context';

export type NewSchedule = {
  filename: string;
  crontab: string;
  inputs: Record<string, any>;
};

export type AddScheduleModalProps = {
  onClose: VoidFunction;
  isOpen: boolean;
  onCreate: (schedule: NewSchedule, resetForm: VoidFunction) => void;
};

const CRONTAB_AI_GENERATOR_API_URL =
  'https://crontab-ai-generator.zipper.run/api';

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  onClose,
  isOpen,
  onCreate,
}) => {
  const { scripts } = useEditorContext();
  const addModalForm = useForm<FieldValues>({
    defaultValues: {
      cronDesc: 'Friday at 6pm',
      crontab: '0 * * * *',
      filename: 'main.ts',
    },
  });
  const [cronString, setCronString] = useState<string>();
  const [cronDescription, setCronDescription] = useState<string>();
  const [isCronDescError, setIsCronDescError] = useState<boolean>(false);
  const [cronDescError, setCronDescError] = useState<string>();
  const [inputParams, setInputParams] = useState<InputParam[] | undefined>();
  const currentCronDescription: string = addModalForm.watch('cronDesc');
  const currentCrontab: string = addModalForm.watch('crontab');

  const handleGenClick = async () => {
    // clear previous errors
    setCronDescError(undefined);
    setIsCronDescError(false);

    if (cronDescription) {
      try {
        const url = `${CRONTAB_AI_GENERATOR_API_URL}?text=${cronDescription}`;
        const response = await fetch(url);
        const parsedResponse = await response.json();
        if (parsedResponse.ok && parsedResponse.data) {
          addModalForm.setValue('crontab', parsedResponse.data);
        }
      } catch (e) {
        console.log(e);
        setCronDescError('Error fetching ai generated cron');
        setIsCronDescError(true);
      }
    }
  };

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
    if (currentCronDescription) {
      setCronDescription(currentCronDescription);
    }
  }, [currentCronDescription]);

  useEffect(() => {
    if (isOpen) {
      setInputParams(
        parseInputForTypes({
          code: scripts.find((s) => s.filename === 'main.ts')?.code,
        }),
      );
    }
  }, [isOpen]);

  const user = useUser();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxH="2xl">
        <ModalHeader>Create a new schedule</ModalHeader>
        <ModalCloseButton />
        <ModalBody
          fontSize="sm"
          flex={1}
          display="flex"
          flexDirection="column"
          gap={8}
          overflow="auto"
        >
          <FormControl flex={1} display="flex" flexDirection="column">
            <FormLabel>Script to run</FormLabel>
            <Select
              size="md"
              color="fg.900"
              bgColor="bgColor"
              {...addModalForm.register('filename', {
                onChange: (e) => {
                  addModalForm.setValue('filename', e.target.value);
                  try {
                    const inputs = parseInputForTypes({
                      code: scripts.find((s) => s.filename === e.target.value)
                        ?.code,
                      throwErrors: true,
                    });
                    setInputParams(inputs);
                  } catch (e) {
                    setInputParams(undefined);
                  }
                },
              })}
            >
              {scripts
                .filter((s) => s.isRunnable)
                .map((script) => (
                  <option key={script.id}>{script.filename}</option>
                ))}
            </Select>
          </FormControl>
          <FormControl
            flex={1}
            display="flex"
            flexDirection="column"
            isInvalid={isCronDescError}
          >
            <FormLabel>I want a job that runs every...</FormLabel>
            <HStack>
              <Input
                size="md"
                type="text"
                color="fg.900"
                bgColor="bgColor"
                {...addModalForm.register('cronDesc')}
              />
              {isCronDescError ? (
                <FormErrorMessage>{cronDescError}</FormErrorMessage>
              ) : (
                <></>
              )}
              <Button
                colorScheme="purple"
                flex={1}
                fontWeight="medium"
                onClick={handleGenClick}
              >
                Gen
              </Button>
            </HStack>
          </FormControl>
          <FormControl flex={1} display="flex" flexDirection="column">
            <FormLabel>Schedule (as a cron expression)</FormLabel>
            <Input
              size="md"
              type="text"
              color="fg.900"
              bgColor="bgColor"
              {...addModalForm.register('crontab')}
            />
            <FormHelperText color="fg.900" fontWeight="semibold">
              {cronString}
            </FormHelperText>
          </FormControl>

          {inputParams && inputParams.length > 0 && (
            <VStack
              alignItems="stretch"
              flex={1}
              spacing={3}
              flexShrink={1}
              overflow="auto"
            >
              <>
                <FormLabel mb="0">Inputs for this scheduled run:</FormLabel>
                <VStack
                  flex={1}
                  background="fg.100"
                  p="4"
                  borderRadius="12"
                  alignItems="stretch"
                  overflow="auto"
                  mt="0"
                >
                  <FunctionInputs
                    params={inputParams}
                    formContext={addModalForm}
                  />
                </VStack>
              </>
            </VStack>
          )}
          {inputParams === undefined && (
            <Text size="sm">
              This script does not have a main or handler function defined
            </Text>
          )}
          <HStack border="1px solid" borderColor={'fg.100'} p="2">
            <Text>This job will be run as </Text>
            <Text fontWeight={'medium'}>{user.user?.name || 'You'}</Text>
          </HStack>
        </ModalBody>
        <ModalFooter justifyContent="space-between">
          <Button
            variant="outline"
            onClick={onClose}
            mr="3"
            flex={1}
            fontWeight="medium"
          >
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            flex={1}
            fontWeight="medium"
            onClick={() => {
              const { filename, crontab, ...inputs } = addModalForm.getValues();
              onCreate({ filename, crontab, inputs }, addModalForm.reset);
            }}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
