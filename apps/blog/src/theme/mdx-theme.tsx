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
  TextProps,
  HeadingProps,
  Link,
  Text,
  BoxProps,
  Container,
  Grid,
  List,
  OrderedList,
} from '@chakra-ui/react';
import { ChakraUIRenderer } from '@zipper/ui';
import MarkdownIt from 'markdown-it-footnote';

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
        <Text className="nx-sr-only nx-select-none"> (opens in a new tab)</Text>
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

  return ChakraUIRenderer({
    a: A,
    h1: H1,
    h2: (props: HeadingProps) => (
      <HeadingLink
        as="h2"
        size="2xl"
        color={getRandomColor()?.color}
        mt={16}
        mb={8}
        {...props}
      />
    ),
    h3: (props: HeadingProps) => (
      <HeadingLink as="h3" size="xl" mt={12} mb={6} {...props} />
    ),
    h4: (props: HeadingProps) => (
      <HeadingLink as="h4" size="lg" mt={10} mb={4} {...props} />
    ),
    h5: (props: HeadingProps) => (
      <HeadingLink as="h5" size="md" my={2} {...props} />
    ),
    h6: (props: HeadingProps) => (
      <HeadingLink as="h6" size="sm" my={2} {...props} />
    ),
    section: ({ children, ...props }: BoxProps) => {
      if (props.className === 'footnotes') {
        return (
          <Box
            as={Grid}
            maxW="container.xl"
            w="full"
            px={0}
            gridTemplateColumns={{ base: '0px 100%', lg: '1fr 412px' }}
            gap={{ base: 0, lg: 5 }}
            position={{ lg: 'absolute' }}
            top="1200px"
            margin={{ lg: '0 auto' }}
          >
            <Box bg="transparent" w="full" h="full" />
            <Box as="section" w="full" {...props}>
              {React.Children.map(children, (child) => {
                console.log(child);
                if (React.isValidElement(child)) {
                  if (child.type.name === 'h2') {
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
                    if (child.type.name === 'ol') {
                      return <OrderedList {...child.props} />;
                    }
                  }
                }
                return null; // or handle other non-valid elements as needed
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
          ml="-1rem"
          mr="-1rem"
          my="1rem"
        >
          {React.Children.map(props.children, (child) => (
            <span>{child}</span>
          ))}
        </Box>
      );
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
      <Flex as="main" direction="column">
        {children}
      </Flex>
    </MDXProvider>
  );
};
