import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next';
import { getProviders, signIn } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { getCsrfToken } from 'next-auth/react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { SiGithub } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export const renderIcon = (providerName: string) => {
  switch (providerName) {
    case 'GitHub':
      return <SiGithub size={24} />;
    case 'Google':
      return <FcGoogle size={24} />;
    default:
      return null;
  }
};

export default function SignIn({
  providers,
  csrfToken,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [email, setEmail] = useState<string>('');
  const router = useRouter();
  const { error, callbackUrl } = router.query;

  const callbackURIComponent = callbackUrl
    ? `&callbackUrl=${encodeURIComponent(callbackUrl as string)}`
    : '';

  const emailError = error === 'EmailSignin';

  return (
    <>
      <Center w="100%" h="100vh">
        <VStack spacing="12">
          <ZipperLogo fill="currentColor" />
          <Card
            pt={10}
            shadow="xl"
            display="flex"
            flexDirection="column"
            gap={4}
            width="sm"
          >
            <CardHeader py={0}>
              <Stack>
                <Heading as="h1" size="md" whiteSpace="nowrap" fontWeight="600">
                  {router.route === '/auth/signin'
                    ? 'Sign in'
                    : 'Create your account'}
                </Heading>
                <Text fontSize="md" color="fg.600">
                  to continue to Zipper
                </Text>
              </Stack>
            </CardHeader>
            <CardBody pb={4}>
              <Stack gap={4}>
                <VStack>
                  {Object.values(providers)
                    .filter((provider) => provider.id !== 'email')
                    .map((provider) => (
                      <Button
                        key={provider.name}
                        justifyContent="start"
                        width="full"
                        gap={4}
                        variant="ghost"
                        border="1px"
                        borderColor="fg.200"
                        borderRadius="none"
                        onClick={() => signIn(provider.id)}
                      >
                        <Icon>{renderIcon(provider.name)}</Icon>
                        <Text fontWeight={'normal'}>
                          Continue with {provider.name}
                        </Text>
                      </Button>
                    ))}
                </VStack>
                <HStack gap={2}>
                  <Box w="50%" borderBottom="1px solid" borderColor="fg.300" />
                  <Text>or</Text>
                  <Box w="50%" borderBottom="1px solid" borderColor="fg.300" />
                </HStack>

                <Stack width="full" gap={2}>
                  <form>
                    <input
                      name="csrfToken"
                      type="hidden"
                      defaultValue={csrfToken}
                    />
                    <FormControl>
                      <FormLabel>
                        <Text fontSize="sm" fontWeight="medium" color="fg.600">
                          Email address
                        </Text>
                      </FormLabel>
                      <Input
                        borderColor={emailError ? 'red.500' : 'fg.200'}
                        name="email"
                        type="email"
                        placeholder=""
                        autoComplete="email"
                        rounded="none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {emailError && (
                        <Text fontSize="sm" color="red.500">
                          Invalid email address
                        </Text>
                      )}
                    </FormControl>
                    <Button
                      mt={4}
                      type="submit"
                      width="full"
                      variant="solid"
                      colorScheme="purple"
                      rounded="none"
                      onClick={(e) => {
                        e.preventDefault();
                        signIn('email', {
                          email,
                          redirect: false,
                        });
                        router.push(
                          `/auth/verify-request?email=${encodeURIComponent(
                            email,
                          )}${callbackURIComponent}`,
                        );
                      }}
                    >
                      Continue
                    </Button>
                    <Text fontSize="xs" color="fg.800" mt={4}>
                      By continuing, you agree to our{' '}
                      <Text
                        as="span"
                        fontSize="xs"
                        color="fg.800"
                        textDecoration="underline"
                      >
                        <Link href="https://zipper.dev/terms">
                          terms and conditions
                        </Link>
                      </Text>
                    </Text>
                  </form>
                </Stack>
              </Stack>
            </CardBody>
          </Card>
        </VStack>
      </Center>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const urlParams = new URLSearchParams(context.query as any);
  const callbackUrl = urlParams.get('callbackUrl');
  const allowCallback =
    callbackUrl?.startsWith(
      `http://${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST}`,
    ) ||
    callbackUrl?.startsWith(
      `https://${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST}`,
    );
  const session = await getServerSession(context.req, context.res, authOptions);

  const csrfToken = await getCsrfToken(context);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: allowCallback ? callbackUrl : '/' } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [], csrfToken },
  };
}

SignIn.skipAuth = true;
SignIn.header = () => <></>;
