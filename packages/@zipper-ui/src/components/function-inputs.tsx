import './file-upload/uploadthing.css';
import { Select, Spinner } from '@chakra-ui/react';
import { Suspense, useRef, useState } from 'react';
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
import { UploadButton } from './file-upload/uploadthing';
import { useUploadContext } from './upload-button-context';
import { VscAdd } from 'react-icons/vsc';
import {
  FieldValues,
  UseFormReturn,
  RegisterOptions,
  Controller,
} from 'react-hook-form';
import { InputType, InputParam, ParsedNode, LiteralNode } from '@zipper/types';
import { getFieldName } from '@zipper/utils';
import { ErrorBoundary } from './error-boundary';
import { AutoResizeTextarea } from './auto-resize-text-area';
import React from 'react';
import { MultiSelect } from './MultiSelect';
import { useMultiSelect } from '../hooks/use-select';

interface Props {
  params: InputParam[] | undefined;
  defaultValues?: any;
  formContext: UseFormReturn<FieldValues, any>;
  isDisabled?: boolean;
  hasResult?: boolean;
}

const isLiteralNode = (node: ParsedNode): node is LiteralNode => {
  if (
    node.type === InputType.string &&
    typeof node.details?.literal === 'string'
  ) {
    return true;
  }
  if (
    node.type === InputType.number &&
    typeof node.details?.literal === 'number'
  ) {
    return true;
  }
  if (
    node.type === InputType.boolean &&
    typeof node.details?.literal === 'boolean'
  ) {
    return true;
  }
  return false;
};

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
  node,
  optional,
  formContext,
  placeholder,
  isDisabled,
}: {
  inputKey: string;
  node: ParsedNode;
  optional: boolean;
  value: any;
  formContext: Props['formContext'];
  placeholder?: string;
  isDisabled?: boolean;
}) {
  const { register, watch, getValues, control } = formContext;
  const { setIsUploading } = useUploadContext();
  const name = getFieldName(inputKey, node.type);
  const formFieldOptions: RegisterOptions<FieldValues, string> = {
    required: !optional,
  };

  if (node.type === InputType.number) {
    formFieldOptions.valueAsNumber = true;
  } else if (node.type === InputType.date) {
    formFieldOptions.valueAsDate = true;
  }

  switch (node.type) {
    case InputType.boolean: {
      return (
        <Switch
          colorScheme="purple"
          {...register(name, formFieldOptions)}
          onChange={(e) => {
            console.log(e.target.checked);
            formContext.setValue(name, e.target.checked);
          }}
          isDisabled={isDisabled}
        />
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
          {...register(name, formFieldOptions)}
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
            {...register(name, formFieldOptions)}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    }

    case InputType.date: {
      const value = getValues(name);

      const formattedDate =
        JSON.stringify(value) !== 'null'
          ? value && value.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      return (
        <Input
          backgroundColor="bgColor"
          type="date"
          {...register(name, formFieldOptions)}
          value={formattedDate}
          placeholder={placeholder}
        />
      );
    }

    case InputType.enum: {
      return (
        <Select
          backgroundColor="bgColor"
          isDisabled={isDisabled}
          {...register(name, formFieldOptions)}
          placeholder={placeholder}
        >
          {node.details.values.map((value, index) => {
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
      if (node.details?.isUnion && node.details.values.every(isLiteralNode)) {
        const form = register(name, formFieldOptions);
        const options = node.details.values.flatMap((node) => {
          if (node.type === InputType.boolean) return [];
          const literal = String(node.details?.literal);
          return [{ label: literal, value: literal }];
        });

        const { options: selectOptions } = useMultiSelect({
          options,
          value: [],
        });

        // TODO: All literals are being treated as strings. Add support for number
        return (
          <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
              <MultiSelect
                options={selectOptions}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                name={form.name}
                controlProps={{
                  backgroundColor: 'bgColor',
                }}
                selectedItemProps={{
                  colorScheme: 'purple',
                }}
              />
            )}
          />
        );
      }

      return (
        <VStack align="start" w="full">
          <Textarea
            backgroundColor="bgColor"
            fontFamily="monospace"
            fontSize="smaller"
            minHeight={14}
            defaultValue="[]"
            {...register(name, formFieldOptions)}
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
            {...register(name, formFieldOptions)}
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
    case InputType.union: {
      const hasTemplateLiteral = false; // TODO
      const allLiteralOrBoolean = node.details.values.every(
        (x) => x.type === InputType.boolean || isLiteralNode(x),
      );

      if (allLiteralOrBoolean && !hasTemplateLiteral) {
        return (
          <Select
            backgroundColor="bgColor"
            isDisabled={isDisabled}
            {...register(name, {
              ...formFieldOptions,
              setValueAs: (value: string) => {
                // TODO: I could use the <option value={index} />,
                // then I could search using the index
                // but I would need to deal with the bug in defaultValue
                const fixedTypeValue = node.details.values.find(
                  (x) =>
                    'details' in x &&
                    x.details &&
                    'literal' in x.details &&
                    String(x.details.literal) === value,
                );
                if (!fixedTypeValue || !isLiteralNode(fixedTypeValue)) return;
                return fixedTypeValue.details?.literal;
              },
            })}
          >
            {node.details.values.map((value) => {
              if (!isLiteralNode(value)) return null; // type guard
              const literal = String(value.details?.literal);
              return (
                <option key={literal} value={literal}>
                  {literal}
                </option>
              );
            })}
          </Select>
        );
      }
      return null;
    }
    case InputType.file: {
      return (
        <UploadButton
          appearance={{
            button({ ready, isUploading }) {
              return `custom-button ${
                ready ? 'custom-button-ready' : 'custom-button-not-ready'
              } ${isUploading ? 'custom-button-uploading' : ''}`;
            },
            container: 'custom-container',
            allowedContent: 'custom-allowed-content',
          }}
          onUploadProgress={() => {
            setIsUploading(true);
          }}
          onUploadBegin={() => {
            setIsUploading(true);
          }}
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            formContext.setValue(name, res[0]?.url);
            setIsUploading(false);
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            console.error(`ERROR! ${error.message}`);
          }}
        />
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
            {...register(name, formFieldOptions)}
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
          {...register(name, formFieldOptions)}
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
  node,
  optional,
  formContext,
  isDisabled,
  hasResult = true,
}: InputParam & {
  name: string;
  formContext: UseFormReturn<FieldValues, any>;
  isDisabled?: boolean;
  hasResult?: boolean;
}): JSX.Element {
  const open = () => {
    formContext.setValue(formName, lastValue.current);
    onOpen();
  };

  const close = () => {
    lastValue.current = formContext.getValues()[formName];
    formContext.setValue(formName, undefined);
    onClose();
  };

  const formName = getFieldName(name, node.type);
  const lastValue = useRef<any>(formContext.getValues()[formName]);
  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen: !optional,
  });
  if (!optional && !isOpen) {
    open();
  }

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
                  {node.type}
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
                      node={node}
                      value={null}
                      optional={optional}
                      formContext={formContext}
                      isDisabled={isDisabled}
                      placeholder={placeholder}
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
  if (!params) {
    return null;
  }
  const inputs = params.map(
    ({ key, name, label, description, node, optional, placeholder }, i) => (
      <SingleInput
        key={`${key}--${i}`}
        name={key}
        label={label || name}
        placeholder={placeholder}
        description={description}
        node={node}
        optional={optional}
        formContext={formContext}
        isDisabled={isDisabled}
        hasResult={hasResult}
      />
    ),
  );

  return inputs.length ? <VStack spacing={1}>{inputs}</VStack> : <></>;
}
