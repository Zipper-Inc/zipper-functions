import { Box, ChakraProps, useColorModeValue } from '@chakra-ui/react';
import { prettierFormat } from '@zipper/ui';
import { Highlight, themes } from 'prism-react-renderer';

export const Code = ({
  code: codePassedIn,
  language = '',
  ...props
}: {
  code: string;
  language?: string;
} & ChakraProps) => {
  const theme = useColorModeValue(themes.oneLight, themes.oneDark);
  let code = codePassedIn;

  if (
    ['typescript', 'ts', 'tsx', 'javascript', 'js', 'jsx'].includes(
      language.toLowerCase(),
    )
  ) {
    code = prettierFormat(code);
  }

  return (
    <Highlight theme={theme} code={code.trimEnd()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Box
          p={4}
          w="full"
          fontSize="sm"
          className={className}
          __css={style}
          {...props}
        >
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
