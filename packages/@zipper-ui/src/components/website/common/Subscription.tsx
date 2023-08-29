import { Input, Button, Flex } from '@chakra-ui/react';
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
      as="form"
      w="full"
      aria-label="Subscription form"
      h="full"
      justify="center"
      align="center"
      {...props}
    >
      <Input
        height="2.75rem"
        width="full"
        borderRadius="8px"
        bg="white"
        variant="outline"
        placeholder="Email address"
        borderColor="gray.300"
        fontSize="md"
        color="gray.500"
      />
      <Button
        height="2.75rem"
        w="full"
        fontSize="md"
        borderRadius="8px"
        bg="brandOrange.500"
        padding="10px 18px"
        color="white"
        fontWeight={500}
        _hover={{ background: 'brandOrange.700' }}
      >
        Join the beta
      </Button>
    </Flex>
  );
};
