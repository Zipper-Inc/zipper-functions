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
} from '@chakra-ui/react';
import { InputParam } from '@zipper/types';
import { FunctionInputs } from '@zipper/ui';
import cronstrue from 'cronstrue';
import { useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';

export type NewSchedule = { crontab: string; inputs: Record<string, any> };

export type AddScheduleModalProps = {
  onClose: VoidFunction;
  isOpen: boolean;
  inputParams: InputParam[];
  onCreate: (schedule: NewSchedule, resetForm: VoidFunction) => void;
};

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  onClose,
  isOpen,
  inputParams,
  onCreate,
}) => {
  const addModalForm = useForm<FieldValues>({
    defaultValues: {
      crontab: '0 * * * *',
    },
  });
  const [cronString, setCronString] = useState<string>();
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
            <FormLabel>Cron expression:</FormLabel>
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
          <VStack
            alignItems="stretch"
            flex={1}
            spacing={3}
            flexShrink={1}
            overflow="auto"
          >
            <Text size="sm">Inputs for this scheduled run:</Text>
            <VStack
              flex={1}
              background="gray.100"
              p="4"
              borderRadius="12"
              alignItems="stretch"
              overflow="auto"
            >
              <FunctionInputs params={inputParams} formContext={addModalForm} />
            </VStack>
          </VStack>
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
            onClick={addModalForm.handleSubmit(({ crontab, ...inputs }) =>
              onCreate({ crontab, inputs }, addModalForm.reset),
            )}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
