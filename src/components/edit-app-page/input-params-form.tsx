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

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

interface Props {
  params: InputParam[];
  defaultValues: any;
  onChange: (values: Record<string, any>) => any;
}

function JSONEditor({ inputKey, type }: { inputKey: string; type: string }) {
  const { control } = useFormContext();
  const { field } = useController({
    name: `${inputKey}:${type}`,
    control,
    defaultValue: type === InputType.array ? '[]' : '{}',
  });
  if (!Editor) return null;
  return (
    <Box ml={-4} width="100%" height="80px">
      <Editor
        defaultLanguage="json"
        height="80px"
        defaultValue={type === InputType.array ? '[]' : '{}'}
        options={{
          minimap: { enabled: false },
          find: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
        }}
        {...field}
      />
    </Box>
  );
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
  const { register } = useFormContext();
  const formProps = register(`${inputKey}:${type}`, {
    required: !optional,
    valueAsNumber: type === InputType.number,
    valueAsDate: type === InputType.date,
  });

  switch (type) {
    case InputType.boolean: {
      return <Switch {...formProps} />;
    }
    case InputType.string: {
      return (
        <Textarea fontFamily="monospace" fontSize="smaller" {...formProps} />
      );
    }

    case InputType.number: {
      return (
        <Input
          fontFamily="monospace"
          type="number"
          fontSize="smaller"
          {...formProps}
        />
      );
    }

    case InputType.date: {
      return <Input type="date" {...formProps} />;
    }

    case InputType.array:
    case InputType.object:
    case InputType.any:
    default: {
      return <JSONEditor inputKey={inputKey} type={type} />;
    }
  }
}

export default function InputParamsForm({ params = [], defaultValues }: Props) {
  const inputs = params.map(({ key, type, optional }) => (
    <FormLabel width="100%" p="4">
      <VStack justify="start" align="start" spacing={2}>
        <Heading size="sm">{key}</Heading>
        <HStack spacing={2} align="start" justify="start">
          <Badge variant="outline" colorScheme="purple" fontSize=".6rem">
            {type}
          </Badge>
          {!optional && (
            <Badge variant="subtle" fontSize=".6rem">
              Required
            </Badge>
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
        <JSONEditor inputKey="params" type="any" />
      )}
    </Box>
  );
}
