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
  p: (props: any) => {
    const { children, node } = props;

    if (node.children[0].tagName === 'img') {
      const image = node.children[0];
      const metastring = image.properties.alt;
      const alt = metastring?.replace(/ *\{[^)]*\} */g, '');

      // TODO: maybe we can figure it out a way to use this properly, for now im fallbacking to 100% of width
      // const metaWidth = metastring.match(/{([^}]+)x/);
      // const metaHeight = metastring.match(/x([^}]+)}/);
      // const width = metaWidth ? metaWidth[1] : '768';
      // const height = metaHeight ? metaHeight[1] : '432';

      const hasCaption = metastring?.toLowerCase().includes('{caption:');
      const caption = metastring?.match(/{caption: (.*?)}/)?.pop();

      return (
        <div className="postImgWrapper">
          <Image
            src={image.properties.src}
            width="100%"
            className="postImg"
            alt={alt}
          />
          {hasCaption ? (
            <div className="caption" aria-label={caption}>
              {caption}
            </div>
          ) : null}
        </div>
      );
    }
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
      <Text
        borderLeft={'solid'}
        borderLeftWidth={4}
        borderColor="primary"
        as="blockquote"
        pl={3}
        pr={2}
        py={2}
      >
        {children}
      </Text>
    );
  },
  code: (props) => {
    const { inline, children, className } = props;

    const isInline = inline || typeof children === 'string';
    if (isInline) {
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
    console.log('text???', props);
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
    console.log('heading props', props);
    const { level, children } = props;
    const sizes = ['xl', 'lg', 'md', 'sm', 'xs', '2xs'];
    return (
      <Heading
        {...getCoreProps(props)}
        mb={level > 3 ? 1 : 4}
        color={`fg${Math.min(4 + level, 9)}00`}
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
