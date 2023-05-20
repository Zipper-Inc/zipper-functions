import { Flex, VStack, Text, Center, Button, Box } from '@chakra-ui/react';
import { UserButton, SignOutButton } from '@clerk/nextjs';
import { useEffectOnce, ZipperLogo, ZipperSymbol } from '@zipper/ui';
import router from 'next/router';
import { useState } from 'react';
import { readJWT } from '~/utils/get-zipper-auth';

export default function Unauthorized() {
  const [user, setUser] = useState<Record<string, string> | undefined>();

  useEffectOnce(() => {
    const token = document.cookie
      .split('; ')
      .find((c) => c.startsWith('__zipper_token'));
    if (token) {
      setUser(readJWT(token));
    }
  });

  return (
    <Box as="main">
      <Flex as="header" mx={8} my={4} justifyContent="end" color="gray.600">
        {user && (
          <VStack
            align={'start'}
            spacing="0"
            background={'gray.100'}
            p="2"
            borderRadius={4}
          >
            {/* <UserButton showName /> */}
          </VStack>
        )}
      </Flex>
      <Center h="lg" bg="gray.100" m="20" rounded="2xl">
        <VStack spacing="20" w="md">
          <Box as={ZipperLogo} fill={'gray.400'} h="2em" />
          <VStack spacing="6" w="md">
            {!user && (
              <>
                <Text
                  color="gray.900"
                  fontSize={'lg'}
                  textAlign="center"
                  fontWeight={'medium'}
                >
                  This app requires you to be signed in to Zipper before you can
                  use it.
                </Text>
                <Button
                  colorScheme="purple"
                  onClick={() => {
                    router.push(
                      `/sign-in?redirect=${encodeURIComponent(
                        window.location.toString(),
                      )}`,
                    );
                  }}
                >
                  <ZipperSymbol fill="white" height={16} />
                  Sign In to Zipper
                </Button>
              </>
            )}
            {user && (
              <Button colorScheme={'purple'} variant="outline">
                {/* <SignOutButton /> */}
              </Button>
            )}
          </VStack>
        </VStack>
      </Center>
    </Box>
  );
}
