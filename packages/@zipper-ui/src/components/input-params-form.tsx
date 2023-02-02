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
import { FieldValues, UseFormReturn, RegisterOptions } from 'react-hook-form';
import { InputType, InputParam } from '@zipper/types';

interface Props {
  params: InputParam[];
  defaultValues?: any;
  formContext: UseFormReturn<FieldValues, any>;
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
        <Textarea
          backgroundColor="white"
          fontFamily="monospace"
          fontSize="smaller"
          minHeight={90}
          defaultValue={type === InputType.array ? '[]' : '{}'}
          {...formProps}
        />
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
        <Textarea
          backgroundColor="white"
          fontFamily="monospace"
          fontSize="smaller"
          minHeight={90}
          defaultValue="{}"
          {...formContext.register('params')}
        />
      )}
    </Box>
  );
}
