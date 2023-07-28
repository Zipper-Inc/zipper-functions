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
import { Heading, HeadingProps, Link, Text } from '@chakra-ui/react';
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

const useComponents = (): Components => {
  const { config } = useBlogContext();
  return ChakraUIRenderer({
    a: A,
    h1: H1,
    h2: (props: HeadingProps) => (
      <HeadingLink as="h2" size="2xl" my={4} {...props} />
    ),
    h3: (props: HeadingProps) => (
      <HeadingLink as="h3" size="xl" my={2} {...props} />
    ),
    h4: (props: HeadingProps) => (
      <HeadingLink as="h4" size="lg" my={2} {...props} />
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
  return <MDXProvider components={useComponents()}>{children}</MDXProvider>;
};
