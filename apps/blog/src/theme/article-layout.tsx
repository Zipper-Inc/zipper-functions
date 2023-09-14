import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Container,
  Flex,
  Text,
} from '@chakra-ui/react';
import { Markdown } from '@zipper/ui';
import type { ReactNode } from 'react';
import { BasicLayout } from './basic-layout';
import { useBlogContext } from './blog-context';
import { MDXTheme } from './mdx-theme';
import Meta from './meta';

export const ArticleLayout = ({ children }: { children: ReactNode }) => {
  const { config, opts } = useBlogContext();
  return (
    <BasicLayout>
      <Container
        maxWidth="container.xl"
        w="full"
        display={{ base: 'flex', lg: 'none' }}
        gap={2}
      >
        <Meta />
      </Container>
      <Flex w="full" bg="brandGray.100" direction="column" align="center">
        <Container
          flexDir={['column', 'row']}
          maxWidth="container.xl"
          w="full"
          py={{ base: 4, lg: 24 }}
          gap={2}
        >
          <Flex w="full" gap={5}>
            <Box as="main" w={{ base: 'full' }} flex={1}>
              {opts.frontMatter.summary && (
                <Accordion maxW="container.md" allowToggle mb="8">
                  <AccordionItem border="1px solid" borderColor="blue.300">
                    <h2>
                      <AccordionButton>
                        <Box
                          as="span"
                          flex="1"
                          textAlign="left"
                          fontWeight="bold"
                        >
                          ⚡️ TL;DR
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pt="4" whiteSpace="pre-wrap">
                      <Markdown>{opts.frontMatter.summary}</Markdown>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}
              <MDXTheme>
                {children}
                {config.postFooter}
                {config.comments}
              </MDXTheme>
            </Box>
          </Flex>
        </Container>
      </Flex>
    </BasicLayout>
  );
};
