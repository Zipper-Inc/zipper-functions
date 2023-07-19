import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';
import { BasicLayout } from './basic-layout';
import { useBlogContext } from './blog-context';
import { MDXTheme } from './mdx-theme';
import Nav from './nav';
import { collectPostsAndNavs } from './utils/collect';
import getTags from './utils/get-tags';
import { Heading, Link } from '@chakra-ui/react';

export function PostsLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const { config, opts } = useBlogContext();
  const { posts } = collectPostsAndNavs({ config, opts });
  const router = useRouter();
  const { type } = opts.frontMatter;
  const tagName = type === 'tag' ? router.query.tag : null;

  const postList = posts.map((post) => {
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

    return (
      <div key={post.route} className="post-item">
        <Heading as="h3" size="xl">
          <NextLink href={post.route} passHref legacyBehavior>
            <Link textDecoration="none">{postTitle}</Link>
          </NextLink>
        </Heading>
        {description && (
          <p className="nx-mb-2 dark:nx-text-gray-400 nx-text-gray-600">
            {description}
            {config.readMore && (
              <NextLink href={post.route} passHref legacyBehavior>
                <a className="post-item-more nx-ml-2">{config.readMore}</a>
              </NextLink>
            )}
          </p>
        )}
        {date && (
          <time
            className="nx-text-sm dark:nx-text-gray-400 nx-text-gray-600"
            dateTime={date.toISOString()}
          >
            {date.toDateString()}
          </time>
        )}
      </div>
    );
  });
  return (
    <BasicLayout>
      <MDXTheme>{children}</MDXTheme>
      {postList}
    </BasicLayout>
  );
}
