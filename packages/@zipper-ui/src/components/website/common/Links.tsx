import { ChakraProps, Link, Text } from '@chakra-ui/react';
import React, { useMemo } from 'react';

export const Links = (props: {
  data: { label: string; href: string; external?: boolean }[];
  component?: any;
}) => {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';

  const LINK_STYLES: Record<string, ChakraProps> = useMemo(
    () => ({
      active: {
        fontWeight: 'semibold',
        color: 'blue.500',
        _hover: {
          color: 'blue.400',
        },
      },
      idle: {
        fontSize: 'medium',
        fontWeight: 'normal',
        color: 'gray.600',
        _hover: {
          color: 'blue.500',
          textDecoration: 'none',
        },
      },
    }),
    [],
  );

  const activeLink = useMemo(() => {
    return props.data.find((route) => route.href === pathname);
  }, [props.data, pathname]);

  return (
    <React.Fragment>
      {props.data.map((link, index) => {
        const styles =
          activeLink?.href === link.href
            ? { ...LINK_STYLES.idle, ...LINK_STYLES.active }
            : LINK_STYLES.idle;

        if (link.external === false) {
          return (
            <Text as={props.component} key={index} href={link.href} {...styles}>
              {link.label}
            </Text>
          );
        }

        if (link.external === true) {
          return (
            <Link key={index} href={link.href} isExternal {...styles}>
              {link.label}
            </Link>
          );
        }
      })}
    </React.Fragment>
  );
};
