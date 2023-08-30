import { Box, Container, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { BasicLayout } from './basic-layout';
import { useBlogContext } from './blog-context';
import { GetStartedBanner } from './get-started';
import { MDXTheme } from './mdx-theme';
import Meta from './meta';

export const ArticleLayout = ({ children }: { children: ReactNode }) => {
  const { config } = useBlogContext();
  return (
    <BasicLayout>
      <Flex w="full" bg="gray.100" direction="column" align="center">
        <Container
          flexDir={['column', 'row']}
          maxWidth="container.xl"
          w="full"
          py="24"
          gap={2}
        >
          <Flex w="full" gap={5}>
            <Box as="main" flex={1}>
              <MDXTheme>
                {children}
                {config.postFooter}
                {config.comments}
              </MDXTheme>
            </Box>
            <Flex direction="column" as="span">
              <Meta />
              <GetStartedBanner />
            </Flex>
          </Flex>
        </Container>
      </Flex>
    </BasicLayout>
  );
};
