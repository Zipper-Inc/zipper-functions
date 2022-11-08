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
import { useController, useFormContext } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { InputType, InputParam } from '~/types/input-params';

const JSONEditor = dynamic(() => import('~/components/json-editor'), {
  ssr: false,
});

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
  return JSONEditor ? (
    <Box
      width="100%"
      height="90px"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      py="1"
      backgroundColor="white"
    >
      <JSONEditor
        onChange={onChange}
        height="80px"
        defaultValue={type === InputType.array ? '[]' : '{}'}
      />
    </Box>
  ) : null;
}

function InputParamsInput({
  inputKey,
  type,
  optional,
  value,
}: {
  inputKey: string;
  type: string;
  optional: boolean;
  value: any;
}) {
  const { register, getValues } = useFormContext();
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
      return <JSONInput inputKey={inputKey} type={type} />;
    }
  }
}

export default function InputParamsForm({ params = [], defaultValues }: Props) {
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
        <JSONInput inputKey="params" type="any" />
      )}
    </Box>
  );
}
