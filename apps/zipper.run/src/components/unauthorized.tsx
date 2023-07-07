import { Flex, VStack, Text, Center, Button, Box } from '@chakra-ui/react';
import { useEffectOnce, ZipperLogo, ZipperSymbol } from '@zipper/ui';
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
      <Flex as="header" mx={8} my={4} justifyContent="end" color="fg.600">
        {user && (
          <VStack
            align={'start'}
            spacing="0"
            background={'fg.100'}
            p="2"
            borderRadius={4}
          >
            {/* <UserButton showName /> */}
          </VStack>
        )}
      </Flex>
      <Center h="lg" bg="fg.100" m="20" rounded="2xl">
        <VStack spacing="20" w="md">
          <Box as={ZipperLogo} fill={'fg.400'} h="2em" />
          <VStack spacing="6" w="md">
            {!user && (
              <>
                <Text
                  color="fg.900"
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
                    window.location.href = `${process.env
                      .NEXT_PUBLIC_ZIPPER_DOT_DEV_URL!}/auth/from/${
                      window.location.host.split('.')[0]
                    }`;
                  }}
                >
                  <ZipperSymbol fill="bgColor" height={16} />
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
