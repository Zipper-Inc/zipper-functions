import { Button, Flex, Link } from '@chakra-ui/react';
import React from 'react';

type WebSiteSubscriptionProps = Partial<
  Pick<
    React.CSSProperties,
    'flexDirection' | 'alignItems' | 'justifyContent' | 'gap'
  >
>;

export const WebSiteSubscriptionForm = ({
  flexDirection = 'column',
  ...props
}: WebSiteSubscriptionProps) => {
  return (
    <Flex
      direction={flexDirection}
      gap={1}
      w="220px"
      h="full"
      justify="center"
      align="center"
      {...props}
    >
      <Button
        as={Link}
        href="/auth/signin"
        isExternal
        fontWeight={500}
        color="gray.600"
        textDecoration="none"
        height="2.75rem"
        w="full"
        variant="outline"
        _hover={{ background: 'gray.300', textDecor: 'none' }}
      >
        Sign in
      </Button>
      <Button
        as={Link}
        height="2.75rem"
        minWidth="full"
        fontSize={{ base: 'sm', md: 'md' }}
        bg="brandOrange.500"
        padding={{ base: '5px 8px', md: '10px 18px' }}
        color="white"
        fontWeight={500}
        _hover={{ background: 'brandOrange.700', textDecor: 'none' }}
        href="/auth/signup"
        rounded="sm"
        isExternal
      >
        Join the beta
      </Button>
    </Flex>
  );
};
