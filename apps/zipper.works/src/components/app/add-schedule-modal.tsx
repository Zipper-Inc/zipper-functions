import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  ModalFooter,
  Button,
  Text,
  Select,
  CardBody,
  Card,
  Divider,
  HStack,
} from '@chakra-ui/react';
import { useUser } from '@clerk/nextjs';
import { InputParam } from '@zipper/types';
import { FunctionInputs } from '@zipper/ui';
import cronstrue from 'cronstrue';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { parseInputForTypes } from '~/utils/parse-input-for-types';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';

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

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  onClose,
  isOpen,
  onCreate,
}) => {
  const { scripts } = useEditorContext();
  const addModalForm = useForm<FieldValues>({
    defaultValues: {
      crontab: '0 * * * *',
      filename: 'main.ts',
    },
  });
  const [cronString, setCronString] = useState<string>();
  const [inputParams, setInputParams] = useState<InputParam[] | undefined>();
  const currentCrontab: string = addModalForm.watch('crontab');

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
    if (isOpen) {
      setInputParams(
        parseInputForTypes(scripts.find((s) => s.filename === 'main.ts')?.code),
      );
    }
  }, [isOpen]);

  const user = useUser();
  const { appInfo } = useRunAppContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxH="2xl">
        <ModalHeader>Create a new schedule</ModalHeader>
        <ModalCloseButton />
        <ModalBody
          fontSize="sm"
          color="neutral.700"
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
              color="gray.900"
              {...addModalForm.register('filename', {
                onChange: (e) => {
                  addModalForm.setValue('filename', e.target.value);
                  try {
                    const inputs = parseInputForTypes(
                      scripts.find((s) => s.filename === e.target.value)?.code,
                      true,
                    );
                    setInputParams(inputs);
                  } catch (e) {
                    setInputParams(undefined);
                  }
                },
              })}
            >
              {scripts.map((script) => (
                <option key={script.id}>{script.filename}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl flex={1} display="flex" flexDirection="column">
            <FormLabel>Schedule (as a cron expression)</FormLabel>
            <Input
              size="md"
              type="text"
              color="gray.900"
              {...addModalForm.register('crontab')}
            />
            <FormHelperText color="gray.900" fontWeight="semibold">
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
                  background="gray.100"
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
          <HStack border="1px solid" borderColor={'gray.100'} p="2">
            <Text>This job will be run as </Text>
            <Text fontWeight={'medium'}>{user.user?.fullName || 'You'}</Text>
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
            type="submit"
            flex={1}
            fontWeight="medium"
            isDisabled={!inputParams}
            onClick={addModalForm.handleSubmit(
              ({ crontab, filename, ...inputs }) =>
                onCreate({ filename, crontab, inputs }, addModalForm.reset),
            )}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
