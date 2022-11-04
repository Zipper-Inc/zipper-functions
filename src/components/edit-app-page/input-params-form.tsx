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
import { useForm, useFormContext } from 'react-hook-form';
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

function JSONEditor(props: any) {
  const { defaultValue } = props;
  console.log('json props', props);
  if (!Editor) return null;
  return (
    <Editor
      defaultLanguage="json"
      height="10vh"
      defaultValue={defaultValue || '{}'}
      options={{
        minimap: { enabled: false },
        find: { enabled: false },
        lineNumbers: 'off',
        glyphMargin: true,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
      }}
    />
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
  const formProps = register(`${inputKey}:${type},`, {
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
      return (
        <JSONEditor defaultValue={type === InputType.array ? '[]' : '{}'} />
      );
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
        <JSONEditor />
      )}
    </Box>
  );
}
