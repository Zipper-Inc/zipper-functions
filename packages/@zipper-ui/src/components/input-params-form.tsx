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
} from '@chakra-ui/react';
import { FieldValues, useController, UseFormReturn } from 'react-hook-form';
import { InputType, InputParam } from '@zipper/types';

interface Props {
  params: InputParam[];
  defaultValues?: any;
  formContext: UseFormReturn<FieldValues, any>;
}

function JSONInput({
  inputKey,
  type,
  formContext,
}: {
  inputKey: string;
  type: string;
  formContext: Props['formContext'];
}) {
  const { control } = formContext;
  const {
    field: { onChange },
  } = useController({
    name: `${inputKey}:${type}`,
    control,
    defaultValue: type === InputType.array ? '[]' : '{}',
  });
  return (
    <Box
      width="100%"
      height="90px"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      py="1"
      backgroundColor="white"
    >
      <Textarea
        onChange={onChange}
        defaultValue={type === InputType.array ? '[]' : '{}'}
      />
    </Box>
  );
}

function InputParamsInput({
  inputKey,
  type,
  optional,
  formContext,
}: {
  inputKey: string;
  type: string;
  optional: boolean;
  value: any;
  formContext: Props['formContext'];
}) {
  const { register } = formContext;
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
        <Input
          backgroundColor="white"
          fontFamily="monospace"
          type="number"
          fontSize="smaller"
          {...formProps}
        />
      );
    }

    case InputType.date: {
      return <Input backgroundColor="white" type="date" {...formProps} />;
    }

    case InputType.array:
    case InputType.object:
    case InputType.any:
    default: {
      return (
        <JSONInput inputKey={inputKey} type={type} formContext={formContext} />
      );
    }
  }
}

export function InputParamsForm({ params = [], formContext }: Props) {
  const inputs = params.map(({ key, type, optional }, i) => (
    <FormLabel width="100%" my="2" key={`${key}-${i}`}>
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
            formContext={formContext}
          />
        </Flex>
      </VStack>
    </FormLabel>
  ));

  return (
    <Box>
      {inputs.length ? (
        <VStack px={1} spacing={1} divider={<StackDivider color="purple" />}>
          {inputs}
        </VStack>
      ) : (
        <JSONInput inputKey="params" type="any" formContext={formContext} />
      )}
    </Box>
  );
}
