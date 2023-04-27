import { FunctionInputs } from '@zipper/ui';
import { InputParams } from '@zipper/types';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { HiOutlinePlay } from 'react-icons/hi2';

export type UserInputsProps = {
  inputs: InputParams;
  hasResult: boolean;
  formContext: UseFormReturn<FieldValues, any>;
  canRunApp: boolean;
  runApp: () => void;
};

export default function UserInputs({
  inputs,
  formContext,
  canRunApp,
  runApp,
  hasResult,
}: UserInputsProps) {
  return (
    <VStack
      p={6}
      alignItems="stretch"
      bgColor="gray.50"
      rounded="2xl"
      spacing="2.5"
    >
      {inputs.length > 0 && (
        <Box mb={4}>
          <FunctionInputs
            params={inputs}
            formContext={formContext}
            isDisabled={!canRunApp}
            hasResult={hasResult}
          />
        </Box>
      )}
      <Box>
        <Button
          colorScheme="purple"
          onClick={runApp}
          width="full"
          isDisabled={!canRunApp}
        >
          <HiOutlinePlay />
          <Text marginLeft={2}>Run</Text>
        </Button>
      </Box>
    </VStack>
  );
}
