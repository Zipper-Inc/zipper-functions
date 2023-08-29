import { ChakraProps, Link } from '@chakra-ui/react';
import React, { useMemo } from 'react';

export const Links = ({
  data,
  component,
}: {
  data: { label: string; href: string }[];
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
    return data.find((route) => route.href === pathname);
  }, [data, pathname]);

  return (
    <React.Fragment>
      {data.map((link, index) => {
        const styles =
          activeLink?.href === link.href
            ? { ...LINK_STYLES.idle, ...LINK_STYLES.active }
            : LINK_STYLES.idle;

        return (
          <Link as={component} key={index} href={link.href} {...styles}>
            {link.label}
          </Link>
        );
      })}
    </React.Fragment>
  );
};
