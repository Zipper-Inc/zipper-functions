import * as React from 'react';
import deepmerge from 'deepmerge';
import {
  Code,
  Divider,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Text,
  UnorderedList,
} from '@chakra-ui/layout';
import { Image } from '@chakra-ui/image';
import { Checkbox } from '@chakra-ui/checkbox';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import { chakra } from '@chakra-ui/system';
import { Components } from 'react-markdown/src/ast-to-react';

type GetCoreProps = {
  children?: React.ReactNode;
  'data-sourcepos'?: any;
};

function getCoreProps(props: GetCoreProps): any {
  return props['data-sourcepos']
    ? { 'data-sourcepos': props['data-sourcepos'] }
    : {};
}

export const defaults: Components & { heading: Components['h1'] } = {
  p: (props) => {
    const { children } = props;
    return (
      <Text mb={2} mt={1} whiteSpace={'pre-wrap'}>
        {children}
      </Text>
    );
  },
  em: (props) => {
    const { children } = props;
    return <Text as="em">{children}</Text>;
  },
  blockquote: (props) => {
    const { children } = props;
    return (
      <Code as="blockquote" p={2}>
        {children}
      </Code>
    );
  },
  code: (props) => {
    const { inline, children, className } = props;

    if (inline) {
      return <Code p={2} children={children} />;
    }

    return (
      <Code
        className={className}
        whiteSpace="break-spaces"
        display="block"
        w="full"
        p={2}
        children={children}
      />
    );
  },
  del: (props) => {
    const { children } = props;
    return <Text as="del">{children}</Text>;
  },
  hr: () => {
    return <Divider />;
  },
  a: Link,
  img: Image,
  text: (props) => {
    const { children } = props;
    return <Text as="span">{children}</Text>;
  },
  ul: (props) => {
    const { ordered, children, depth } = props;

    const attrs = getCoreProps(props);
    let Element = UnorderedList;
    let styleType = 'disc';
    if (ordered) {
      Element = OrderedList;
      styleType = 'decimal';
    }
    if (depth === 1) styleType = 'circle';

    return (
      <Element
        spacing={2}
        as={ordered ? 'ol' : 'ul'}
        styleType={styleType}
        pl={4}
        {...attrs}
      >
        {children}
      </Element>
    );
  },
  ol: (props) => {
    const { ordered, children, depth } = props;
    const attrs = getCoreProps(props);
    let Element = UnorderedList;
    let styleType = 'disc';
    if (ordered) {
      Element = OrderedList;
      styleType = 'decimal';
    }
    if (depth === 1) styleType = 'circle';
    return (
      <Element
        spacing={2}
        as={ordered ? 'ol' : 'ul'}
        styleType={styleType}
        pl={4}
        {...attrs}
      >
        {children}
      </Element>
    );
  },
  li: (props) => {
    const { children, checked } = props;
    let checkbox = null;
    if (checked !== null && checked !== undefined) {
      checkbox = (
        <Checkbox isChecked={checked} isReadOnly>
          {children}
        </Checkbox>
      );
    }
    return (
      <ListItem
        {...getCoreProps(props)}
        listStyleType={checkbox !== null ? 'none' : 'inherit'}
      >
        {checkbox || children}
      </ListItem>
    );
  },
  heading: (props) => {
    const { level, children } = props;
    const sizes = ['xl', 'lg', 'md', 'sm', 'xs', '2xs'];
    return (
      <Heading
        {...getCoreProps(props)}
        mb={level > 3 ? 1 : 4}
        color={`gray.${Math.min(4 + level, 9)}00`}
        as={`h${level}`}
        size={sizes[`${level - 1}`]}
      >
        {children}
      </Heading>
    );
  },
  pre: (props) => {
    const { children } = props;
    return <chakra.pre {...getCoreProps(props)}>{children}</chakra.pre>;
  },
  table: Table,
  thead: Thead,
  tbody: Tbody,
  tr: (props) => <Tr>{props.children}</Tr>,
  td: (props) => <Td>{props.children}</Td>,
  th: (props) => <Th>{props.children}</Th>,
};

function ChakraUIRenderer(theme?: unknown, merge = true) {
  const elements = {
    p: defaults.p,
    em: defaults.em,
    blockquote: defaults.blockquote,
    code: defaults.code,
    del: defaults.del,
    hr: defaults.hr,
    a: defaults.a,
    img: defaults.img,
    text: defaults.text,
    ul: defaults.ul,
    ol: defaults.ol,
    li: defaults.li,
    h1: defaults.heading,
    h2: defaults.heading,
    h3: defaults.heading,
    h4: defaults.heading,
    h5: defaults.heading,
    h6: defaults.heading,
    pre: defaults.pre,
    table: defaults.table,
    thead: defaults.thead,
    tbody: defaults.tbody,
    tr: defaults.tr,
    td: defaults.td,
    th: defaults.th,
  };

  if (theme && merge) {
    return deepmerge(elements, theme);
  }

  return elements;
}

export default ChakraUIRenderer;
