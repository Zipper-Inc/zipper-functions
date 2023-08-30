import {
  CardHeader,
  Center,
  Heading,
  VStack,
  Stack,
  Text,
  Card,
  CardBody,
  Button,
  Input,
} from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function VerifyRequest() {
  const router = useRouter();
  const { email, callbackUrl } = router.query;
  const callbackURIComponent = callbackUrl
    ? `&callbackUrl=${encodeURIComponent(callbackUrl as string)}`
    : '';

  const [token, setToken] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  const onReady = () => {
    window.location.href = `/api/auth/callback/email?email=${encodeURIComponent(
      email as string,
    )}&token=${token}${callbackURIComponent}`;
  };

  useEffect(() => {
    if (token.length === 11) {
      onReady();
    }
  }, [token]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <Center w="100%" h="100vh">
        <VStack spacing="12">
          <ZipperLogo />
          <Card
            px={4}
            py={10}
            shadow="xl"
            display="flex"
            flexDirection="column"
            gap={4}
            width="sm"
          >
            <CardHeader py={0}>
              <Stack gap={0}>
                <Heading as="h1" size="md" whiteSpace="nowrap" fontWeight="600">
                  Check your email
                </Heading>
              </Stack>
            </CardHeader>
            <CardBody>
              <Stack gap={4} alignContent="start" alignItems="start">
                <Text color="fg.600">
                  {email ? (
                    <>
                      We sent a magic link to <b>{email}</b>
                    </>
                  ) : (
                    <>We sent a magic link to your email</>
                  )}
                </Text>
                <Input
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter code"
                  fontSize="lg"
                  autoFocus
                  ref={inputRef}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onReady();
                    }
                  }}
                ></Input>
                <Text fontSize="sm" color="fg.500">
                  Didn't receive it? Check your spam folder or{' '}
                  <Button
                    variant="link"
                    colorScheme="purple"
                    fontSize="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      signIn('email', {
                        email,
                        redirect: false,
                        callbackUrl: callbackUrl as string,
                      });
                      router.push(
                        `/auth/verify-request?email=${email}${callbackURIComponent}`,
                      );
                    }}
                  >
                    resend link
                  </Button>
                </Text>

                <Text color="fg.500" fontSize="sm">
                  Didn't work?{' '}
                  <Button
                    variant="link"
                    colorScheme="purple"
                    fontSize="sm"
                    onClick={() => {
                      window.location.href = `/auth/signin${callbackURIComponent}`;
                    }}
                  >
                    Use another method
                  </Button>
                </Text>
              </Stack>
            </CardBody>
          </Card>
        </VStack>
      </Center>
    </>
  );
}

VerifyRequest.skipAuth = true;
VerifyRequest.header = () => <></>;
