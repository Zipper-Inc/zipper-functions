import { ChakraProps, Link, Text } from '@chakra-ui/react';
import React, { useMemo } from 'react';

export const Links = ({
  mode = 'light',
  ...props
}: {
  data: { label: string; href: string; external?: boolean }[];
  displayActiveLink?: boolean;
  color?: Record<'default' | 'hover', ChakraProps['color']>;
  mode?: 'dark' | 'light';
  textDecor?: ChakraProps['textDecor'];
  component?: any;
}) => {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';

  const colorMode: Record<
    typeof mode,
    Record<'active' | 'idle', ChakraProps>
  > = {
    dark: {
      active: {
        color: 'gray.50',
        _hover: {
          color: 'gray.100',
        },
      },
      idle: {
        color: { base: 'gray.900', md: 'gray.50' },
        _hover: {
          color: { base: 'gray.600', md: 'gray.200' },
          textDecoration: props.textDecor ?? 'none',
        },
      },
    },
    light: {
      active: {
        color: 'blue.500',
        _hover: {
          color: 'blue.400',
        },
      },
      idle: {
        color: { base: 'gray.900', md: 'gray.900' },
        _hover: {
          color: { base: 'gray.600', md: 'gray.600' },
          textDecoration: props.textDecor ?? 'none',
        },
      },
    },
  };

  const LINK_STYLES: Record<string, ChakraProps> = useMemo(
    () => ({
      active: {
        fontWeight: 'semibold',
        ...colorMode[mode].active,
      },
      idle: {
        fontSize: 'medium',
        fontWeight: 'normal',
        ...colorMode[mode].idle,
      },
    }),
    [],
  ) as Record<string, ChakraProps>;

  const activeLink = useMemo(() => {
    return props.data.find((route) => pathname.includes(route.href));
  }, [props.data, pathname]);

  return (
    <React.Fragment>
      {props.data.map((link, index) => {
        const styles =
          activeLink?.href === link.href && props.displayActiveLink === true
            ? { ...LINK_STYLES.idle, ...LINK_STYLES.active }
            : LINK_STYLES.idle;

        if (link.external === false) {
          return (
            <Text
              py={1}
              as={props.component}
              key={index}
              href={link.href}
              {...styles}
            >
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
