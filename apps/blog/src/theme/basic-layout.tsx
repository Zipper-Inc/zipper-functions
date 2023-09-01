import { Container, Heading, HStack, Text } from '@chakra-ui/react';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useBlogContext } from './blog-context';
import { HeadingContext } from './mdx-theme';
import { Website } from '@zipper/ui';
import { useRouter } from 'next/router';
import { FiChevronLeft } from 'react-icons/fi';
import NextLink from 'next/link';

export const BasicLayout = ({ children }: { children: ReactNode }) => {
  const { config, opts } = useBlogContext();
  const { asPath, push } = useRouter();
  const title = `${opts.title}${config.titleSuffix || ''}`;
  const ref = useRef<HTMLHeadingElement>(null);

  return (
    <>
      <Head>
        <title>{title} - Zipper</title>
        {config.head?.({ title, meta: opts.frontMatter })}
      </Head>
      <Website>
        <Website.Navbar links={{ component: NextLink }} />
        <HeadingContext.Provider value={ref}>
          {asPath === '/blog' ? (
            <Container
              as="header"
              dir="ltr"
              py={10}
              maxWidth="container.xl"
              width="full"
              margin="0 auto"
              gap={2}
            >
              <Heading
                as="h1"
                fontFamily="plaak"
                fontSize="4xl"
                color="blue.500"
              >
                Zipper Blog
              </Heading>
            </Container>
          ) : (
            <Container
              as="header"
              dir="ltr"
              maxWidth="container.xl"
              mx="auto"
              gap={5}
              display="flex"
              flexDirection="column"
              py={24}
            >
              <HStack
                as="nav"
                _hover={{ opacity: '.75' }}
                cursor="pointer"
                color="gray.500"
                onClick={() => push('/blog')}
              >
                <FiChevronLeft size={24} />
                <Text fontSize="lg">Zipper Blog</Text>
              </HStack>
              {opts.hasJsxInH1 ? (
                <Heading as="h1" fontWeight="normal" size="3xl" ref={ref} />
              ) : null}
              {opts.hasJsxInH1 ? null : (
                <Heading
                  fontFamily="plaak"
                  fontWeight={{ base: 700, lg: 400 }}
                  color="primary"
                  margin="0"
                  fontSize={{ base: '4xl', lg: '64px' }}
                >
                  {opts.title}
                </Heading>
              )}
              <Heading as="h3" fontSize="lg" fontWeight={400}>
                {opts.frontMatter.description}
              </Heading>
            </Container>
          )}
          {/* <Container maxWidth="container.xl" w="full" py="24" gap={2}> */}
          {children}
          {/* {config.footer} */}
          {/* </Container> */}
          <Website.Footer />
        </HeadingContext.Provider>
      </Website>
    </>
  );
};
