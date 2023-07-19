import { Flex, Container, Heading } from '@chakra-ui/react';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useBlogContext } from './blog-context';
import { HeadingContext } from './mdx-theme';
import { SimpleSiteHeader } from '@zipper/ui';

export const BasicLayout = ({ children }: { children: ReactNode }) => {
  const { config, opts } = useBlogContext();
  const title = `${opts.title}${config.titleSuffix || ''}`;
  const ref = useRef<HTMLHeadingElement>(null);
  return (
    <>
      <Head>
        <title>{title} - Zipper</title>
        {config.head?.({ title, meta: opts.frontMatter })}
      </Head>
      <SimpleSiteHeader />
      <HeadingContext.Provider value={ref}>
        <Flex backgroundColor="primary" color="bgColor" shadow="sm" mb={2}>
          <Container
            as="header"
            dir="ltr"
            maxWidth="container.lg"
            mx="auto"
            gap={2}
            display="flex"
            flexDirection="column"
            my={12}
          >
            {opts.hasJsxInH1 ? (
              <Heading as="h1" fontWeight="normal" size="3xl" ref={ref} />
            ) : null}
            {opts.hasJsxInH1 ? null : (
              <Heading as="h1" fontWeight="normal" size="3xl">
                {opts.title}
              </Heading>
            )}
          </Container>
        </Flex>
        <Container
          as="article"
          dir="ltr"
          maxWidth="container.lg"
          mx="auto"
          mb={16}
          gap={2}
          display="flex"
          flexDirection="column"
        >
          {children}
          {config.footer}
        </Container>
      </HeadingContext.Provider>
    </>
  );
};
