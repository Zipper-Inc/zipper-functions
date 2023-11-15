import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChakraUIRenderer from '../../utils/chakra-markdown-renderer';
import React from 'react';

export const Markdown = ({
  children,
  appInfo,
  currentUser,
}: {
  children: string;
  appInfo?: { slug: string; name: string };
  currentUser?: { username: string };
}) => {
  let content = children;
  const appMap = {
    '{{appName}}': 'name',
    '{{appSlug}}': 'slug',
  };

  if (appInfo) {
    content = content.replace(/({{)(appName|appSlug)(}})/gi, (matched) => {
      return appInfo[
        appMap[matched as keyof typeof appMap] as keyof typeof appInfo
      ];
    });
  }

  if (currentUser) {
    content = content.replace(/({{)(username)(}})/gi, currentUser.username);
  }

  return (
    <ReactMarkdown
      components={ChakraUIRenderer()}
      children={content}
      remarkPlugins={[remarkGfm as any]}
    />
  );
};
