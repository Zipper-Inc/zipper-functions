import { Select, Spinner } from '@chakra-ui/react';
import React, { Suspense, useRef, useState } from 'react';
import {
  Box,
  Flex,
  Input,
  Switch,
  Textarea,
  Heading,
  FormLabel,
  Badge,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useDisclosure,
  Text,
} from '@chakra-ui/react';
import { VscAdd } from 'react-icons/vsc';
import { FieldValues, UseFormReturn, RegisterOptions } from 'react-hook-form';
import { InputType, InputParam } from '@zipper/types';
import { getFieldName } from '@zipper/utils';
import { ErrorBoundary } from './error-boundary';
import { AutoResizeTextarea } from './auto-resize-text-area';
import { UploadButton } from './file-upload/uploadthing';

interface Props {
  params: InputParam[];
  defaultValues?: any;
  formContext: UseFormReturn<FieldValues, any>;
  isDisabled?: boolean;
  hasResult?: boolean;
}

/*
const withOptional =
  (InnerComponent: (props: any) => ReactElement) => (componentProps: any) => {
    const [isDefined, setIsDefined] = useState(false);
    return (
      <Box opacity={!isDefined ? '50%' : '100%'}>
        {!isDefined && <Button onClick={() => setIsDefined(true)}>+</Button>}
        <InnerComponent {...componentProps} />
        isDefined && <Button onClick={() => setIsDefined(true)}>+</Button>}
      </Box>
    );
  };
*/

function FunctionParamInput({
  inputKey,
  type,
  optional,
  formContext,
  placeholder,
  isDisabled,
  details,
}: {
  inputKey: string;
  type: InputType;
  optional: boolean;
  value: any;
  formContext: Props['formContext'];
  placeholder?: string;
  isDisabled?: boolean;
  details?: any;
}) {
  const { register, watch } = formContext;

  const name = getFieldName(inputKey, type);
  const formFieldOptions: RegisterOptions<FieldValues, string> = {
    required: !optional,
  };

  if (type === InputType.number) {
    formFieldOptions.valueAsNumber = true;
  } else if (type === InputType.date) {
    formFieldOptions.valueAsDate = true;
  }

  const formProps = register(name, formFieldOptions);

  switch (type) {
    case InputType.boolean: {
      return (
        <Switch colorScheme="purple" {...formProps} isDisabled={isDisabled} />
      );
    }

    case InputType.string: {
      return (
        <AutoResizeTextarea
          backgroundColor="bgColor"
          fontFamily="monospace"
          fontSize={watch()[name]?.length < 100 ? 'smaller' : 'md'}
          minHeight={14}
          maxH="xl"
          overflowY="scroll"
          isDisabled={isDisabled}
          _placeholder={{ color: 'fg.300' }}
          {...formProps}
          placeholder={placeholder}
        />
      );
    }

    case InputType.number: {
      return (
        <NumberInput width="full" isDisabled={isDisabled}>
          <NumberInputField
            backgroundColor="bgColor"
            fontFamily="monospace"
            fontSize="smaller"
            {...formProps}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    }

    case InputType.date: {
      return (
        <Input
          backgroundColor="bgColor"
          type="date"
          {...formProps}
          isDisabled={isDisabled}
          placeholder={placeholder}
        />
      );
    }

    case InputType.enum: {
      return (
        <Select
          backgroundColor="bgColor"
          isDisabled={isDisabled}
          {...formProps}
          placeholder={placeholder}
        >
          {details.values.map((value: any, index: number) => {
            const optionLabel = typeof value === 'object' ? value.key : value;
            const optionValue = typeof value === 'object' ? value.value : value;
            return (
              <option key={index} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </Select>
      );
    }

    case InputType.array: {
      const [error, setError] = useState<string | undefined>();
      return (
        <VStack align="start" w="full">
          <Textarea
            backgroundColor="bgColor"
            fontFamily="monospace"
            fontSize="smaller"
            minHeight={14}
            defaultValue="[]"
            {...formProps}
            isDisabled={isDisabled}
            placeholder={placeholder}
            onChange={(e) => {
              // TODO: validate obj with zod array schema got from `parseCode`
              try {
                JSON.parse(e.target.value);
                formContext.setValue(name, e.target.value);
                setError(undefined);
              } catch (e: any) {
                setError(`Error parsing value: ${e.message}`);
              }
            }}
          />
          {error && (
            <Text color="fg.600" fontWeight="light" fontSize="sm" pl={1}>
              {error}
            </Text>
          )}
        </VStack>
      );
    }
    case InputType.object: {
      const [error, setError] = useState<string | undefined>();
      return (
        <VStack align="start" w="full">
          <Textarea
            backgroundColor="bgColor"
            fontFamily="monospace"
            fontSize="smaller"
            minHeight={90}
            defaultValue="{}"
            {...formProps}
            isDisabled={isDisabled}
            placeholder={placeholder}
            onChange={(e) => {
              // TODO: validate obj with zod object schema got from `parseCode`
              try {
                JSON.parse(e.target.value);
                formContext.setValue(name, e.target.value);
                setError(undefined);
              } catch (e: any) {
                setError(`Error parsing value: ${e.message}`);
              }
            }}
          />
          {error && (
            <Text color="fg.600" fontWeight="light" fontSize="sm" pl={1}>
              {error}
            </Text>
          )}
        </VStack>
      );
    }
    case InputType.file: {
      return (
        <VStack
          align="start"
          alignItems={'center'}
          w="full"
          display={'flex'}
          flexDirection={'row'}
          gap={2}
        >
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              formContext.setValue(name, res[0]?.url);
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              console.error(`ERROR! ${error.message}`);
            }}
          />
        </VStack>
      );
    }
    case InputType.any: {
      return (
        <VStack align="start" w="full">
          <Textarea
            backgroundColor="bgColor"
            fontFamily="monospace"
            fontSize="smaller"
            minHeight={14}
            {...formProps}
            isDisabled={isDisabled}
            placeholder=""
            onChange={(e) => {
              formContext.setValue(name, e.target.value);
            }}
          />
        </VStack>
      );
    }
    default: {
      return (
        <Textarea
          backgroundColor="bgColor"
          fontFamily="monospace"
          fontSize="smaller"
          minHeight={14}
          isDisabled={isDisabled}
          {...formProps}
          placeholder={placeholder}
        />
      );
    }
  }
}

function SingleInput({
  name,
  label,
  description,
  placeholder,
  type,
  optional,
  formContext,
  isDisabled,
  details,
  hasResult = true,
}: {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type: InputType;
  optional: boolean;
  formContext: UseFormReturn<FieldValues, any>;
  isDisabled?: boolean;
  hasResult?: boolean;
  details?: any;
}): JSX.Element {
  const formName = getFieldName(name, type);

  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen: !optional,
  });
  const lastValue = useRef<any>(formContext.getValues()[formName]);

  const open = () => {
    formContext.setValue(formName, lastValue.current);
    onOpen();
  };

  const close = () => {
    lastValue.current = formContext.getValues()[formName];
    formContext.setValue(formName, undefined);
    onClose();
  };

  return (
    <Box width="100%" position="relative">
      <FormLabel my="2" mx={0}>
        <VStack justify="start" align="start" spacing={1.5}>
          <HStack spacing={2} align="center" width="full" paddingRight={8}>
            <Heading
              size="sm"
              fontWeight="medium"
              ml={0.5}
              mr={2}
              alignSelf="center"
              opacity={!isOpen ? '50%' : '100%'}
              color={isDisabled ? 'fg.400' : 'fg.700'}
            >
              {label || name}
            </Heading>
            <Box mt={1} opacity={!isOpen ? '50%' : '100%'}>
              {hasResult && (
                <Badge
                  variant="subtle"
                  colorScheme="darkPurple"
                  fontSize="xs"
                  fontWeight="medium"
                  py="0.5"
                  px={2}
                >
                  {type}
                </Badge>
              )}
            </Box>
            {optional && (
              <>
                <Box mt={1}>
                  <Badge variant="subtle" color="fg.400" fontSize=".6rem">
                    {!isOpen ? 'Optional' : 'Included'}
                  </Badge>
                </Box>
              </>
            )}
          </HStack>
          {isOpen && (
            <VStack w="full" align="start" spacing="2">
              <Flex width="100%">
                <ErrorBoundary
                  fallback={
                    <Text fontSize="sm" fontWeight="medium" color="red.500">
                      An error occurred while loading the input
                    </Text>
                  }
                >
                  <Suspense fallback={<Spinner />}>
                    <FunctionParamInput
                      inputKey={name}
                      type={type}
                      value={null}
                      optional={optional}
                      formContext={formContext}
                      isDisabled={isDisabled}
                      placeholder={placeholder}
                      details={details}
                    />
                  </Suspense>
                </ErrorBoundary>
              </Flex>

              {description && (
                <Text fontSize="sm" fontWeight="normal" color="fg.600">
                  {description}
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </FormLabel>
      {optional && (
        <Flex
          position="absolute"
          right={0}
          left={!isOpen ? 0 : undefined}
          top={0}
          height={10}
          alignItems="center"
          justifyContent="end"
        >
          <Button
            display="flex"
            alignItems="center"
            justifyContent="end"
            name={!isOpen ? 'Add input' : 'Remove input'}
            variant="unstyled"
            _hover={{
              color: 'purple.500',
            }}
            size="xs"
            mt="2px"
            p={1}
            height={6}
            width={!isOpen ? 'full' : 6}
            onClick={!isOpen ? open : close}
          >
            <Box
              transition="all 100ms ease-in-out"
              transform={!isOpen ? 'rotate(0deg)' : 'rotate(45deg)'}
            >
              <VscAdd />
            </Box>
          </Button>
        </Flex>
      )}
    </Box>
  );
}

export function FunctionInputs({
  params = [],
  formContext,
  isDisabled,
  hasResult = true,
}: Props) {
  const inputs = params.map(
    (
      { key, name, label, description, type, optional, placeholder, details },
      i,
    ) => (
      <SingleInput
        key={`${key}--${i}`}
        name={key}
        label={label || name}
        placeholder={placeholder}
        description={description}
        type={type}
        optional={optional}
        formContext={formContext}
        isDisabled={isDisabled}
        hasResult={hasResult}
        details={details}
      />
    ),
  );

  return inputs.length ? <VStack spacing={1}>{inputs}</VStack> : <></>;
}
