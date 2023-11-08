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
  Link,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { getRandomColor } from './mdx-theme';
import { GetStartedBanner } from './get-started';

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

    const colorSet = getRandomColor()!;

    const isEven = post.index % 2 == 0;

    return (
      <GridItem
        as="li"
        display="flex"
        key={post.route}
        // h={{ base: 'auto', lg: post.index === 1 ? '350px' : '272px' }}
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
          as={NextLink}
          href={post.route}
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
    <Post key={index} {...post} index={index + 2} />
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
            columnGap={4}
            flex={1}
          >
            <Post {...(firstPost as any)} index={1} />
            {postList}
          </SimpleGrid>
          <GetStartedBanner />
        </Flex>
      </Container>
    </BasicLayout>
  );
}
