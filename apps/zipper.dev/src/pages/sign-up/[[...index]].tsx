import { Center, VStack } from '@chakra-ui/react';
import { SignUp } from '@clerk/nextjs';
import { ZipperLogo } from '@zipper/ui';
import { useRouter } from 'next/router';

const SignUpPage = () => {
  const router = useRouter();
  const redirectUrl = router.query.redirect as string;

  return (
    <Center w="100%" h="100vh">
      <VStack spacing="12">
        <ZipperLogo />
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          redirectUrl={`/auth/success?redirect_url=${redirectUrl || '/'}`}
        />
      </VStack>
    </Center>
  );
};

export default SignUpPage;

SignUpPage.skipAuth = true;
SignUpPage.header = () => <></>;
