import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import { BasicLayout } from './basic-layout';
import { useBlogContext } from './blog-context';
import { collectPostsAndNavs } from './utils/collect';
import getTags from './utils/get-tags';
import {
  Box,
  Button,
  Container,
  Flex,
  GridItem,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';

const COLORS = {
  0: {
    color: 'purple.800',
    hover: 'purple.900',
    btn: 'purple.50',
    hover_btn: 'purple.100',
  },
  1: {
    color: 'brandOrange.500',
    hover: 'brandOrange.600',
    btn: 'brandOrange.50',
    hover_btn: 'brandOrange.100',
  },
  2: {
    color: 'blue.500',
    hover: 'blue.600',
    btn: 'blue.50',
    hover_btn: 'blue.100',
  },
  3: {
    color: 'purple.500',
    hover: 'purple.600',
    btn: 'purple.50',
    hover_btn: 'purple.100',
  },
  4: {
    color: 'purple.800',
    hover: 'purple.900',
    btn: 'purple.50',
    hover_btn: 'purple.100',
  },
};

export function PostsLayout(): ReactElement {
  const { config, opts } = useBlogContext();
  const { posts } = collectPostsAndNavs({ config, opts });
  const router = useRouter();
  const { type } = opts.frontMatter;
  const tagName = type === 'tag' ? router.query.tag : null;

  const [firstPost, ...otherPosts] = posts;

  const Post = (post: (typeof posts)[number] & { index: number }) => {
    if (tagName) {
      const tags = getTags(post);
      if (!Array.isArray(tagName) && !tags.includes(tagName)) {
        return null;
      }
    } else if (type === 'tag') {
      return null;
    }

    const postTitle = post.frontMatter?.title || post.name;

    const date: Date | null = post.frontMatter?.date
      ? new Date(post.frontMatter.date)
      : null;

    const description = post.frontMatter?.description;

    const colorSet = COLORS[post.index as keyof typeof COLORS];

    const isEven = post.index % 2 == 0;

    return (
      <GridItem
        as="li"
        display="flex"
        key={post.route}
        h={{ base: 'auto', lg: post.index === 1 ? '284px' : '272px' }}
        colSpan={post.index === 1 ? 2 : 1}
        position="relative"
        className="post-item"
        flexDir="column"
        py={10}
        alignItems="start"
        justifyContent="space-between"
        gap={3}
      >
        {post.index === 1 && (
          <Box
            as="span"
            h="1px"
            position="absolute"
            left={0}
            top={0}
            bg="gray.200"
            w={isEven && post.index !== 1 ? 'calc(100% + 12px)' : 'full'}
          />
        )}
        <Flex as="div" direction="column" width="full" align="start" gap={1}>
          {date && (
            <time
              className="nx-text-sm dark:nx-text-gray-400 nx-text-gray-400"
              dateTime={date.toISOString()}
            >
              {date.toDateString()}
            </time>
          )}
          <Heading
            as={NextLink}
            href={post.route}
            fontFamily="plaak"
            fontWeight={{ base: 700, lg: post.index === 1 ? 400 : 700 }}
            lineHeight={{ lg: post.index === 1 ? '72px' : '40px' }}
            color={colorSet.color}
            _hover={{
              color: colorSet.hover,
            }}
            margin="0"
            fontSize={{ base: '4xl', lg: post.index === 1 ? '64px' : '3xl' }}
          >
            {postTitle}
          </Heading>
          {description && (
            <Text
              fontSize="lg"
              className="dark:nx-text-gray-400 nx-text-xl nx-text-gray-600"
            >
              {description}
            </Text>
          )}
        </Flex>
        <Button
          variant="solid"
          bg={colorSet.btn}
          color={colorSet.color}
          size="lg"
          width="fit-content"
          _hover={{ bg: colorSet.hover_btn }}
        >
          Read More
        </Button>

        <Box
          as="span"
          h="1px"
          position="absolute"
          left={0}
          bottom={0}
          bg="gray.200"
          w={isEven && post.index !== 1 ? 'calc(100% + 12px)' : 'full'}
        />
      </GridItem>
    );
  };

  const postList = otherPosts.map((post, index) => (
    <Post key={index} {...post} index={index} />
  ));

  return (
    <BasicLayout>
      {/* <MDXTheme>{children}</MDXTheme> */}
      <Container
        flexDir={['column', 'row']}
        maxWidth="container.xl"
        w="full"
        py={{ base: 20, lg: 24 }}
        gap={2}
      >
        <Flex align="start" gap={5}>
          <SimpleGrid
            gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
            as="ul"
            gap={3}
            flex={1}
          >
            <Post {...(firstPost as any)} index={1} />
            {postList}
          </SimpleGrid>
          <Flex
            direction="column"
            align="center"
            display={{ base: 'none', lg: 'flex' }}
            flex={1}
            borderRadius="8px"
            justify="space-between"
            p={10}
            as="span"
            h="320px"
            maxW="380px"
            w="full"
            bg="white"
          >
            <ZipperLogo type="sliced" />

            <Text fontSize="sm" textAlign="center">
              Turn simple functions into robust apps without complex code.
            </Text>

            <Button w="full" maxH="44px" fontWeight={500} colorScheme="purple">
              Get Started for Free
            </Button>

            <Text as="a" href="#" fontSize="sm">
              Learn more about Zipper
            </Text>
          </Flex>
        </Flex>
      </Container>
    </BasicLayout>
  );
}
