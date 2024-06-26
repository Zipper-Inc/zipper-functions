import NextLink from 'next/link';
import { Code } from 'nextra/components';
import { MDXProvider } from 'nextra/mdx';
import type { Components } from 'nextra/mdx';
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react';
import React, {
  createContext,
  createRef,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useBlogContext } from './blog-context';
import {
  Box,
  CodeProps,
  Flex,
  Heading,
  HeadingProps,
  Link,
  Text,
  BoxProps,
  OrderedList,
  TextProps,
  ListProps,
  List,
  ListItemProps,
  ListItem,
} from '@chakra-ui/react';
import { ChakraUIRenderer } from '@zipper/ui';

export const HeadingContext = createContext<
  RefObject<HTMLHeadingElement | null>
>(createRef());

const H1 = ({ children }: { children?: ReactNode }): ReactElement => {
  const ref = useContext(HeadingContext);
  const { opts } = useBlogContext();
  const [showHeading, setShowHeading] = useState(false);
  useEffect(() => {
    if (ref.current && opts.hasJsxInH1) {
      setShowHeading(true);
    }
  }, [opts.hasJsxInH1, ref]);
  return <>{showHeading && createPortal(children, ref.current!)}</>;
};

function HeadingLink({ children, id, ...props }: HeadingProps) {
  return (
    <Heading {...props}>
      {children}
      <Text id={id} position="absolute" mt={-14} />
      <Link href={id && `#${id}`} aria-label="Section permalink" />
    </Heading>
  );
}

const A = ({ children, ...props }: ComponentProps<'a'>) => {
  const isExternal =
    props.href?.startsWith('https://') || props.href?.startsWith('http://');
  if (isExternal) {
    return (
      <Link target="_blank" rel="noreferrer" color="primary" {...props}>
        {children}
      </Link>
    );
  }
  return props.href ? (
    <NextLink href={props.href} passHref legacyBehavior>
      <Link color="primary" {...props}>
        {children}
      </Link>
    </NextLink>
  ) : null;
};

const COLORS = [
  {
    color: 'purple.800',
    hover: 'purple.900',
    btn: 'purple.50',
    hover_btn: 'purple.100',
  },
  {
    color: 'brandOrange.500',
    hover: 'brandOrange.600',
    btn: 'brandOrange.50',
    hover_btn: 'brandOrange.100',
  },
  {
    color: 'blue.500',
    hover: 'blue.600',
    btn: 'blue.50',
    hover_btn: 'blue.100',
  },
  {
    color: 'purple.500',
    hover: 'purple.600',
    btn: 'purple.50',
    hover_btn: 'purple.100',
  },
  {
    color: 'purple.800',
    hover: 'purple.900',
    btn: 'purple.50',
    hover_btn: 'purple.100',
  },
];

export function getRandomColor() {
  // Get the length of the array.
  const length = COLORS.length;

  // Generate a random number between 0 and the length of the array, inclusive.
  const randomIndex = Math.floor(Math.random() * length);

  // Return the random index.
  return COLORS[randomIndex];
}

const useComponents = (): Components => {
  const { config } = useBlogContext();
  const length = COLORS.length;

  // Generate a random number between 0 and the length of the array, inclusive.
  const randomIndex = Math.floor(Math.random() * length);
  const randomIndex2 = Math.floor(Math.random() * length);

  return ChakraUIRenderer({
    p: (props: TextProps) => <Text {...props} color="gray.900" mb="8" />,
    a: A,
    h1: H1,
    h2: (props: HeadingProps) => (
      <HeadingLink
        as="h2"
        size="xl"
        color={COLORS[randomIndex]?.color || COLORS[0]?.color}
        mt={4}
        mb={4}
        {...props}
      />
    ),
    li: (props: TextProps) => <Text as="li" {...props} color="gray.900" />,
    h3: (props: HeadingProps) => (
      <Heading
        as="h3"
        size="lg"
        mt={6}
        mb={6}
        color={COLORS[randomIndex2]?.color || COLORS[1]?.color}
        {...props}
      />
    ),
    h4: (props: HeadingProps) => (
      <HeadingLink
        as="h4"
        size="md"
        mt={4}
        mb={4}
        color={'gray.600'}
        {...props}
      />
    ),
    h5: (props: HeadingProps) => (
      <HeadingLink as="h5" size="sm" my={2} {...props} />
    ),
    h6: (props: HeadingProps) => (
      <HeadingLink as="h6" size="sm" my={2} {...props} />
    ),
    section: ({ children, ...props }: BoxProps) => {
      if (props.className === 'footnotes') {
        return (
          <Box
            maxW="container.xl"
            w="full"
            px={0}
            gap={{ base: 0, lg: 5 }}
            margin={{ lg: '40px auto' }}
          >
            <Box bg="transparent" w="full" h="full" />
            <Box as="section" w="full" {...props}>
              {React.Children.map(children, (_child) => {
                const child = _child as any;
                if (child.type?.name === 'h2') {
                  return (
                    <Heading
                      fontSize="xl"
                      mb={4}
                      borderBottom="1px"
                      maxW={{ base: 'full', lg: '380px' }}
                      lineHeight={2}
                      color="purple.500"
                      borderColor="purple.500"
                    >
                      Notes
                    </Heading>
                  );
                } else {
                  if (child.type?.name === 'ol') {
                    return <OrderedList {...child.props} />;
                  }
                }
                return null;
              })}
            </Box>
          </Box>
        );
      }
    },
    code: (props: CodeProps) => {
      if (typeof props.children === 'string') {
        return <Code {...(props as any)} />;
      }

      return (
        <Box
          as="pre"
          padding="1rem"
          background="white"
          border="1px solid"
          borderColor="gray.200"
          fontFamily="monospace"
          my="1rem"
        >
          {React.Children.map(props.children, (child) => (
            <span>{child}</span>
          ))}
        </Box>
      );
    },
    sup: (props: any) => {
      return <Text as="sup">[{props.children}]</Text>;
    },
    ...config.components,
  }) as any;
};

export const MDXTheme = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  return (
    <MDXProvider components={useComponents()}>
      <Flex as="main" direction="column" maxW={'container.md'}>
        {children}
      </Flex>
    </MDXProvider>
  );
};
