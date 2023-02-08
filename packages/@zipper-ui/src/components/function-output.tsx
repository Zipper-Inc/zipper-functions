import { Code } from '@chakra-ui/react';

export function FunctionOutput({ result }: { result: string }) {
  return !result ? null : (
    <Code bgColor="black" color="white" py={4} px={8} width="full">
      {result}
    </Code>
  );
}
