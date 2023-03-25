import { Center, VStack } from '@chakra-ui/react';
import { SignIn } from '@clerk/nextjs';
import { ZipperLogo } from '@zipper/ui';
import { useRouter } from 'next/router';

const SignInPage = () => {
  const router = useRouter();
  const redirectUrl = router.query.redirect as string;

  return (
    <Center w="100%" h="100vh">
      <VStack spacing={'50'}>
        <ZipperLogo />
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl={redirectUrl}
        />
      </VStack>
    </Center>
  );
};

export default SignInPage;
