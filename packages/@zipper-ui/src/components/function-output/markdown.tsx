import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChakraUIRenderer from '../../utils/chakra-markdown-renderer';
import React from 'react';

export const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown
    components={ChakraUIRenderer()}
    children={children}
    remarkPlugins={[remarkGfm as any]}
  />
);
