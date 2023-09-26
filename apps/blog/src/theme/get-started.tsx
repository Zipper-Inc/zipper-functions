import { Button, Flex, Link, Text } from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';

export const GetStartedBanner = () => {
  return (
    <Flex
      direction="column"
      align="center"
      flex={1}
      display={{ base: 'none', lg: 'flex' }}
      justify="space-between"
      p={10}
      as="span"
      h="full"
      maxH="320px"
      minH="320px"
      maxW="380px"
      w="full"
      bg="white"
    >
      <ZipperLogo type="sliced" />

      <Text fontSize="sm" textAlign="center" color="gray.900">
        Turn simple functions into robust apps without complex code.
      </Text>

      <Button
        as={Link}
        isExternal
        target="_blank"
        href="https://zipper.dev/auth/signin"
        w="full"
        maxH="44px"
        fontWeight={500}
        colorScheme="purple"
      >
        Get Started for Free
      </Button>

      <Text
        as={Link}
        href="/docs"
        isExternal
        color="gray.900"
        _hover={{ color: 'purple.500' }}
        fontSize="sm"
      >
        Learn more about Zipper
      </Text>
    </Flex>
  );
};
