import '@fontsource/inter';
import type { NextraThemeLayoutProps } from 'nextra';
import type { ReactElement, ReactNode } from 'react';
import { ArticleLayout } from './article-layout';
import { BlogProvider } from './blog-context';
import { DEFAULT_THEME } from './constants';
import { PageLayout } from './page-layout';
import { PostsLayout } from './posts-layout';
import type { LayoutProps } from './types';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@zipper/ui';
import { AnalyticsHead } from '@zipper/utils';

const layoutMap = {
  post: ArticleLayout,
  page: PageLayout,
  posts: PostsLayout,
  tag: PostsLayout,
};

const BlogLayout = ({
  config,
  children,
  opts,
}: LayoutProps & { children: ReactNode }): ReactElement => {
  const type = opts.frontMatter.type || 'post';
  const Layout = layoutMap[type];
  if (!Layout) {
    throw new Error(
      `nextra-theme-blog does not support the layout type "${type}" It only supports "post", "page", "posts" and "tag"`,
    );
  }
  return (
    <ChakraProvider theme={theme}>
      <BlogProvider opts={opts} config={config}>
        <AnalyticsHead tagId={process.env.NEXT_PUBLIC_BLOG_GA_MEASUREMENT_ID} />
        <Layout>{children}</Layout>
      </BlogProvider>
    </ChakraProvider>
  );
};

export default function Layout({
  children,
  ...context
}: NextraThemeLayoutProps) {
  const extendedConfig = { ...DEFAULT_THEME, ...context.themeConfig };

  return (
    <BlogLayout config={extendedConfig} opts={context.pageOpts}>
      {children}
    </BlogLayout>
  );
}

export { useColorMode } from '@chakra-ui/react';
export { useBlogContext } from './blog-context';
export { getStaticTags } from './utils/get-tags';
export * from './types';
