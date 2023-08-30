import NextLink from 'next/link';
import { Code } from 'nextra/components';
import { MDXProvider } from 'nextra/mdx';
import type { Components } from 'nextra/mdx';
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react';
import {
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

function getRandomPosition(array: any[]) {
  // Get the length of the array.
  const length = array.length;

  // Generate a random number between 0 and the length of the array, inclusive.
  const randomIndex = Math.floor(Math.random() * length);

  // Return the random index.
  return randomIndex;
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
        color={COLORS[getRandomPosition(COLORS)]?.color}
        my={16}
        {...props}
      />
    ),
    h3: (props: HeadingProps) => (
      <HeadingLink as="h3" size="xl" my={12} {...props} />
    ),
    h4: (props: HeadingProps) => (
      <HeadingLink as="h4" size="lg" my={10} {...props} />
    ),
    h5: (props: HeadingProps) => (
      <HeadingLink as="h5" size="md" my={2} {...props} />
    ),
    h6: (props: HeadingProps) => (
      <HeadingLink as="h6" size="sm" my={2} {...props} />
    ),
    code: Code,
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
