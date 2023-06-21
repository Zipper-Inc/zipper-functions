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
} from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function VerifyRequest() {
  const router = useRouter();
  const { email } = router.query;

  return (
    <>
      <Center w="100%" h="100vh">
        <VStack spacing="12">
          <ZipperLogo />
          <Card
            px={4}
            py={10}
            shadow="xl"
            rounded="md"
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
                <Text fontSize="md" color="gray.600">
                  to continue to Zipper
                </Text>
              </Stack>
            </CardHeader>
            <CardBody>
              <Stack gap={4} alignContent="start" alignItems="start">
                <Text color="gray.600">
                  {email ? (
                    <>
                      We sent a magic link to <b>{email}</b>
                    </>
                  ) : (
                    <>We sent a magic link to your email</>
                  )}
                </Text>
                <Text color="gray.600">
                  Didn't receive it? Check your spam folder or{' '}
                  <Button
                    variant="link"
                    colorScheme="purple"
                    onClick={(e) => {
                      e.preventDefault();
                      signIn('email', { email, redirect: false });
                      router.push('/auth/verify-request?email=' + email);
                    }}
                  >
                    resend link
                  </Button>
                </Text>

                <Text>
                  Didn't worked yet?{' '}
                  <Button
                    variant="link"
                    colorScheme="purple"
                    onClick={() => {
                      window.location.href = '/auth/signin';
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
