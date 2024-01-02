import {
  Box,
  Center,
  ChakraProps,
  Icon,
  useClipboard,
  useColorModeValue,
} from '@chakra-ui/react';
import { prettierFormat } from '@zipper/ui';
import { Highlight, themes } from 'prism-react-renderer';
import { useMemo } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';

export const Code = ({
  code: codePassedIn,
  language = '',
  ...props
}: {
  code: string;
  language?: string;
} & ChakraProps) => {
  const theme = useColorModeValue(themes.oneLight, themes.oneDark);

  const code = useMemo(() => {
    if (
      ['typescript', 'ts', 'tsx', 'javascript', 'js', 'jsx'].includes(
        language.toLowerCase(),
      )
    ) {
      try {
        return prettierFormat(codePassedIn);
      } catch (e) {}
    }
    return codePassedIn;
  }, []);

  const { onCopy, hasCopied } = useClipboard(code);

  return (
    <Highlight theme={theme} code={code.trimEnd()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Box
          p={4}
          w="full"
          fontSize="sm"
          position="relative"
          className={className}
          __css={style}
          {...props}
        >
          <Center
            position="absolute"
            top={4}
            right={4}
            boxSize={6}
            rounded="md"
            color="fg.400"
            onClick={onCopy}
            _hover={{
              bgColor: 'fg.50',
            }}
            transition={'all 0.2s ease-in-out'}
          >
            <Icon as={hasCopied ? FiCheck : FiCopy} />
          </Center>
          {tokens.map((line, i) => (
            <div key={i + 1} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key + 1} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </Box>
      )}
    </Highlight>
  );
};
