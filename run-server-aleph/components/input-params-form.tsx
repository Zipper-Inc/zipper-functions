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
  StackDivider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {
  useController,
  useFormContext,
  useForm,
  FormProvider,
} from 'react-hook-form';
import { InputType, InputParam } from '../types/app-info.ts';

interface Props {
  params: InputParam[];
  defaultValues?: any;
}

function JSONInput({ inputKey, type }: { inputKey: string; type: string }) {
  const { control } = useFormContext();
  const {
    field: { onChange },
  } = useController({
    name: `${inputKey}:${type}`,
    control,
    defaultValue: type === InputType.array ? '[]' : '{}',
  });
  return (
    <Textarea
      fontFamily="monospace"
      onChange={onChange}
      width="100%"
      height="90px"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      py="1"
      backgroundColor="white"
      {...control}
    />
  );
}

function InputParamsInput({
  inputKey,
  type,
  optional,
}: {
  inputKey: string;
  type: string;
  optional: boolean;
  value: any;
}) {
  const { register } = useFormContext();
  const name = `${inputKey}:${type}`;
  const formProps = register(name, {
    required: !optional,
    valueAsNumber: type === InputType.number,
    valueAsDate: type === InputType.date,
  });

  switch (type) {
    case InputType.boolean: {
      return <Switch colorScheme="purple" {...formProps} />;
    }
    case InputType.string: {
      return (
        <Textarea
          backgroundColor="white"
          fontFamily="monospace"
          fontSize="smaller"
          minHeight={14}
          {...formProps}
        />
      );
    }

    case InputType.number: {
      return (
        <NumberInput backgroundColor="white" width="100%" {...formProps}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    }

    case InputType.date: {
      return <Input backgroundColor="white" type="date" {...formProps} />;
    }

    case InputType.array:
    case InputType.object:
    case InputType.any:
    default: {
      return <JSONInput inputKey={inputKey} type={type} />;
    }
  }
}

export default function InputParamsForm({ params = [] }: Props) {
  const methods = useForm();

  const inputs = params.map(({ key, type, optional }, i) => (
    <FormLabel width="100%" key={`${key}-${i}`}>
      <VStack justify="start" align="start" spacing={1.5}>
        <HStack spacing={2} align="center">
          <Heading
            size="sm"
            fontWeight="bold"
            ml={0.5}
            mr={2}
            alignSelf="center"
          >
            {key}
          </Heading>
          <Box mt={1}>
            <Badge variant="outline" colorScheme="purple" fontSize=".6rem">
              {type}
            </Badge>
          </Box>
          {optional && (
            <Box mt={1}>
              <Badge variant="subtle" color="gray.400" fontSize=".6rem">
                Optional
              </Badge>
            </Box>
          )}
        </HStack>
        <Flex width="100%">
          <InputParamsInput
            inputKey={key}
            type={type}
            value={null}
            optional={optional}
          />
        </Flex>
      </VStack>
    </FormLabel>
  ));

  return (
    <FormProvider {...methods}>
      <Box background="gray.100" p={8}>
        {inputs.length ? (
          <VStack
            px={1}
            spacing={4}
            divider={<StackDivider color="gray.200" />}
          >
            {inputs}
          </VStack>
        ) : (
          <JSONInput inputKey="params" type="any" />
        )}
        <Box>
          <button onClick={() => window.alert('???')}>
            Test not working??
          </button>
        </Box>
      </Box>
    </FormProvider>
  );
}
