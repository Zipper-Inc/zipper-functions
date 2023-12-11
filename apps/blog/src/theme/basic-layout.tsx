import {
  Container,
  Heading,
  HStack,
  Text,
  Spacer,
  Flex,
  Badge,
  Link,
  LightMode,
} from '@chakra-ui/react';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useBlogContext } from './blog-context';
import { HeadingContext } from './mdx-theme';
import { SiteType, Website } from '@zipper/ui';
import { useRouter } from 'next/router';
import { FiChevronLeft } from 'react-icons/fi';
import NextLink from 'next/link';
import { split } from './utils/get-tags';
import { AnalyticsHead } from '@zipper/utils';

export const BasicLayout = ({ children }: { children: ReactNode }) => {
  const { config, opts } = useBlogContext();
  const { asPath } = useRouter();
  const ref = useRef<HTMLHeadingElement>(null);

  const { author, date, tag } = opts.frontMatter;

  const tags = tag ? split(tag) : [];

  const tagsEl = tags.map((t) => (
    <NextLink
      key={t}
      href="/tags/[tag]"
      as={`/tags/${t}`}
      passHref
      legacyBehavior
    >
      <Badge px={4} py={1} colorScheme="orange">
        #{t.replace(' ', '_')}
      </Badge>
    </NextLink>
  ));

  const isIndex = asPath === '/';
  const title = isIndex
    ? 'Zipper Blog | Updates from Zipper Inc.'
    : `${opts.title}${config.titleSuffix || ''} | Zipper Blog`;
  const description = opts.frontMatter.description || opts.description || '';
  const image = '';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:site_name" content="Zipper Blog" />
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ZipperDev" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        {config.head?.({ title, meta: opts.frontMatter })}
      </Head>
      <AnalyticsHead tagId={process.env.NEXT_PUBLIC_BLOG_GA_MEASUREMENT_ID} />
      <Website>
        <LightMode>
          <Website.Navbar links={{ component: Link }} site={SiteType.Blog} />
          <HeadingContext.Provider value={ref}>
            {isIndex ? (
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
                  Latest Posts
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
                {opts.hasJsxInH1 ? (
                  <Heading as="h1" fontWeight="normal" size="3xl" ref={ref} />
                ) : null}
                <HStack>
                  <NextLink href="/">
                    <HStack color="gray.500">
                      <FiChevronLeft size={16} />
                      <Text fontSize="sm" fontFamily="mono">
                        All posts
                      </Text>
                    </HStack>
                  </NextLink>

                  <Heading
                    size="md"
                    overflow="auto"
                    whiteSpace="nowrap"
                    fontWeight="medium"
                    color="fg.400"
                  >
                    |
                  </Heading>
                  <Text fontFamily="mono" color="gray.600" fontSize="sm">
                    <time dateTime={new Date(date || Date.now()).toISOString()}>
                      {new Date(date || Date.now()).toDateString()}
                    </time>
                  </Text>
                </HStack>
                {opts.hasJsxInH1 ? null : (
                  <Heading
                    fontFamily="plaak"
                    fontWeight={{ base: 700, lg: 400 }}
                    color="primary"
                    margin="0"
                    fontSize={{ base: '4xl', lg: '64px' }}
                    maxW="container.lg"
                  >
                    {opts.title}
                  </Heading>
                )}
                <Heading
                  as="h3"
                  fontSize="xl"
                  maxW="container.md"
                  fontWeight={400}
                  color="gray.500"
                  lineHeight="6"
                >
                  {opts.frontMatter.description}
                </Heading>
                <HStack>
                  <HStack color="gray.600">
                    <Text>By</Text>
                    <Text fontWeight="bold">{author}</Text>
                  </HStack>
                  <Spacer />
                  <Flex
                    gap="1"
                    mt={1}
                    flexWrap={'wrap'}
                    className="nx-not-prose nx-mt-1 nx-flex nx-flex-wrap nx-items-center nx-gap-1"
                  >
                    {tagsEl}
                  </Flex>
                </HStack>
              </Container>
            )}
            {/* <Container maxWidth="container.xl" w="full" py="24" gap={2}> */}
            {children}
            {/* {config.footer} */}
            {/* </Container> */}
            <Website.Footer
              links={{ component: Link }}
              hideAppletDemo
              site={SiteType.Blog}
              bgColor={!isIndex ? 'white' : undefined}
            />
          </HeadingContext.Provider>
        </LightMode>
      </Website>
    </>
  );
};
