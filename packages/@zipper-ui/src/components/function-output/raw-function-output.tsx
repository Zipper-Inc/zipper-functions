import { Code } from '@chakra-ui/react';
import { safeJSONParse } from '@zipper/utils';
import { RawOutputProps } from './types';

export function RawFunctionOutput({ result = '' }: RawOutputProps) {
  const parsed = safeJSONParse(result);
  const rawOutput = parsed
    ? JSON.stringify(parsed, null, 2)
    : result.toString();

  return (
    <Code as="pre" backgroundColor="gray.100" width="full">
      {rawOutput}
    </Code>
  );
}
