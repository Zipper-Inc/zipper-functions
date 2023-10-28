import { Checkbox } from '@chakra-ui/checkbox';
import { Image } from '@chakra-ui/image';
import {
  Box,
  Code as ChakraCode,
  Divider,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Text,
  UnorderedList,
} from '@chakra-ui/layout';
import { chakra } from '@chakra-ui/system';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import deepmerge from 'deepmerge';
import * as React from 'react';
import { Components } from 'react-markdown/src/ast-to-react';
import { Code } from '../components/code';

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
  h1: (props) => {
    return (
      <Heading
        as="h1"
        size="lg"
        color="fg.800"
        py={2}
        fontWeight="medium"
        data-markdown
      >
        {props.children}
      </Heading>
    );
  },
  h2: (props) => {
    return (
      <Heading
        as="h2"
        style={{ fontSize: '26px' }}
        color="fg.700"
        py={2}
        fontWeight="medium"
        data-markdown
      >
        {props.children}
      </Heading>
    );
  },
  h3: (props) => {
    return (
      <Heading
        as="h3"
        size="md"
        color="fg.600"
        py={2}
        fontWeight="medium"
        data-markdown
      >
        {props.children}
      </Heading>
    );
  },
  h4: (props) => {
    return (
      <Heading
        as="h4"
        size="sm"
        color="fg.900"
        py={2}
        fontWeight="medium"
        data-markdown
      >
        {props.children}
      </Heading>
    );
  },
  h5: (props) => {
    return (
      <Heading
        as="h5"
        size="xs"
        color="fg.900"
        fontWeight="medium"
        data-markdown
      >
        {props.children}
      </Heading>
    );
  },
  h6: (props) => {
    return (
      <Heading as="h6" size="xs" fontWeight="medium" data-markdown>
        {props.children}
      </Heading>
    );
  },
  p: (props: any) => {
    const { children, node } = props;

    if (node && node?.children && node?.children[0]?.tagName === 'img') {
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
        <div className="postImgWrapper" data-markdown>
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
      <Text mb={2} mt={1} whiteSpace={'pre-wrap'} color="fg.900" data-markdown>
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
      <Box bgColor={'fg.50'} p={4} data-markdown>
        <Text
          position="relative"
          _before={{
            content: '""',
            height: '100%',
            width: '2px',
            background: 'fg.400',
            display: 'block',
            position: 'absolute',
            left: 0,
          }}
          as="blockquote"
          paddingLeft={4}
        >
          {children}
        </Text>
      </Box>
    );
  },
  code: (props) => {
    const { inline, children, className } = props;
    const isInline = inline || typeof children === 'string';
    if (isInline) {
      return (
        <ChakraCode
          fontSize="inherit"
          colorScheme="purple"
          variant="subtle"
          data-markdown
          fontFamily="monospace"
        >
          {children}
        </ChakraCode>
      );
    }

    const langauge = className?.replace('language-', '');
    const [code] = children as string[];

    return (
      <Code
        overflow="scroll"
        code={code || ''}
        language={langauge}
        w="full"
        whiteSpace="pre-wrap"
        data-markdown
      />
    );
  },
  del: (props) => {
    const { children } = props;
    return (
      <Text as="del" data-markdown>
        {children}
      </Text>
    );
  },
  hr: () => {
    return <Divider style={{ marginBottom: '10px' }} data-markdown />;
  },
  a: (props) => {
    return (
      <Link color="primary" {...props} data-markdown>
        {props.children}
      </Link>
    );
  },
  img: Image,
  text: (props) => {
    const { children } = props;
    return (
      <Text as="span" data-markdown>
        {children}
      </Text>
    );
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
        data-markdown
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
        data-markdown
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
        <Checkbox isChecked={checked} isReadOnly data-markdown>
          {children}
        </Checkbox>
      );
    }
    return (
      <ListItem
        {...getCoreProps(props)}
        listStyleType={checkbox !== null ? 'none' : 'inherit'}
        data-markdown
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
        color={`fg${Math.min(4 + level, 9)}00`}
        as={`h${level}`}
        size={sizes[`${level - 1}`]}
        fontWeight="medium"
        data-markdown
      >
        {children}
      </Heading>
    );
  },
  pre: (props) => {
    const { children } = props;
    return (
      <chakra.pre {...getCoreProps(props)} width="full" data-markdown>
        {children}
      </chakra.pre>
    );
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
    h1: defaults.h1,
    h2: defaults.h2,
    h3: defaults.h3,
    h4: defaults.h4,
    h5: defaults.h5,
    h6: defaults.h6,
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
