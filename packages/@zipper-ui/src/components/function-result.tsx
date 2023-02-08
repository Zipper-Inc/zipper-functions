import { Code } from '@chakra-ui/react';

export function FunctionResult({ result }: { result: any }) {
  return (
    <Code bgColor="black" color="white" py={4} px={8} width="full">
      {result}
    </Code>
  );
}
