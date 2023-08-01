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
import { useDebounce } from 'use-debounce';
import parser from 'cron-parser';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useUser } from '~/hooks/use-user';
import { parseInputForTypes } from '~/utils/parse-code';
import { useEditorContext } from '../context/editor-context';
import { initApplet } from '@zipper-inc/client-js';

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
      filename: 'main.ts',
    },
  });

  const [cronString, setCronString] = useState<string>();
  const [crontab, setCrontab] = useState<string>('');
  const [isCronError, setIsCronError] = useState<boolean>(false);
  const [cronErrorString, setCronErrorString] = useState<string>();
  const [inputParams, setInputParams] = useState<InputParam[] | undefined>();
  const currentCronDescription: string = addModalForm.watch('cronDesc');
  const [debouncedCronDesc] = useDebounce(currentCronDescription, 400);

  useEffect(() => {
    (async () => {
      if (!debouncedCronDesc) return;

      try {
        const generatedCron: string = await initApplet('crontab-ai-generator')
          .run({ text: debouncedCronDesc })
          .catch(() => 'invalid response');

        // reset errors
        setIsCronError(false);

        // validate the generated response
        try {
          parser.parseExpression(generatedCron);
        } catch (e) {
          throw new Error(`Invalid crontab: ${generatedCron}`);
        }

        setCronString(`Generated crontab: ${generatedCron}`);
        setCrontab(generatedCron);
      } catch (e) {
        console.log(e);
        setIsCronError(true);
        setCronErrorString(`${e}`);
      }
    })();
  }, [debouncedCronDesc]);

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
            isInvalid={isCronError}
          >
            <FormLabel>I want a job that runs every...</FormLabel>
            <Input
              placeholder="Friday at 6pm"
              size="md"
              type="text"
              color="fg.900"
              bgColor="bgColor"
              {...addModalForm.register('cronDesc')}
            />
            {isCronError ? (
              <FormErrorMessage>{cronErrorString}</FormErrorMessage>
            ) : (
              <FormHelperText color="fg.900" fontWeight="semibold">
                {cronString}
              </FormHelperText>
            )}
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
            isDisabled={!crontab || isCronError}
            colorScheme="purple"
            flex={1}
            fontWeight="medium"
            onClick={() => {
              const { filename, ...inputs } = addModalForm.getValues();
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
