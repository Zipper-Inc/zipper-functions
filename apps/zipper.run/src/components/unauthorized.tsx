import { Flex, VStack, Text, Center, Button, Box } from '@chakra-ui/react';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import { ZipperLogo, ZipperSymbol } from '@zipper/ui';
import router from 'next/router';

export default function Unauthorized() {
  const { user } = useUser();
  const { signOut } = useClerk();

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
            <UserButton showName />
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
              <Button
                colorScheme={'purple'}
                variant="outline"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            )}
          </VStack>
        </VStack>
      </Center>
    </Box>
  );
}
