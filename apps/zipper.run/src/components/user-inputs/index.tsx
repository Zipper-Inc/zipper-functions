import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { InputParams } from '@zipper/types';
import { FunctionInputs } from '@zipper/ui';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { HiOutlinePlay } from 'react-icons/hi2';

export type UserInputsProps = {
  inputs: InputParams;
  hasResult: boolean;
  formContext: UseFormReturn<FieldValues, any>;
  canRunApp: boolean;
  runApp: () => void;
  isLoading: boolean;
  skipAuth: boolean;
};

export default function UserInputs({
  inputs,
  formContext,
  canRunApp,
  runApp,
  hasResult,
  isLoading,
  skipAuth,
}: UserInputsProps) {
  return (
    <VStack
      alignItems="stretch"
      bgColor="white"
      w="full"
      maxW="container.sm"
      spacing="2.5"
    >
      {inputs.length > 0 && (
        <Box mb={4}>
          <FunctionInputs
            params={inputs}
            formContext={formContext}
            isDisabled={!skipAuth && !canRunApp}
            hasResult={hasResult}
          />
        </Box>
      )}
      <Box>
        <Button
          colorScheme="purple"
          onClick={runApp}
          width="full"
          isDisabled={!skipAuth && (!canRunApp || isLoading)}
        >
          <HiOutlinePlay />
          <Text marginLeft={2}>Run</Text>
        </Button>
      </Box>
    </VStack>
  );
}
