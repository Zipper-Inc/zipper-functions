import { Box } from '@chakra-ui/react';
import { InputType, InputParam } from '~/types/input-params';

interface Props {
  params: InputParam[];
  Editor: any;
  defaultValues: any;
  onChange: any;
}

export default function InputParamsForm({
  params,
  Editor,
  defaultValues,
  onChange,
}: Props) {
  const inputs = params.map((param) => {
    return (
      <Box>
        {param.key} / {param.type}
      </Box>
    );
  });

  return <>{inputs}</>;

  return (
    Editor && (
      <Editor
        defaultLanguage="json"
        height="10vh"
        defaultValue="{}"
        options={{
          minimap: { enabled: false },
          find: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
        }}
      />
    )
  );
}
