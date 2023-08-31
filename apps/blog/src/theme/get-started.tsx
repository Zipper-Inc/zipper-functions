import { Button, Flex, Text } from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';

export const GetStartedBanner = () => {
  return (
    <Flex
      direction="column"
      align="center"
      flex={1}
      display={{ base: 'none', lg: 'flex' }}
      borderRadius="8px"
      justify="space-between"
      p={10}
      as="span"
      h="full"
      maxH="320px"
      maxW="380px"
      w="full"
      bg="white"
    >
      <ZipperLogo type="sliced" />

      <Text fontSize="sm" textAlign="center">
        Turn simple functions into robust apps without complex code.
      </Text>

      <Button w="full" maxH="44px" fontWeight={500} colorScheme="purple">
        Get Started for Free
      </Button>

      <Text as="a" href="#" fontSize="sm">
        Learn more about Zipper
      </Text>
    </Flex>
  );
};
