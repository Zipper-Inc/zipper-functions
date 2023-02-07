import { Center, VStack } from '@chakra-ui/react';
import { SignIn } from '@clerk/nextjs';
import { ZipperLogo } from '@zipper/ui';
import { useRouter } from 'next/router';
import { NoHeaderLayout } from '~/components/no-header-layout';
import { NextPageWithLayout } from '../_app';

const SignInPage: NextPageWithLayout = () => {
  const router = useRouter();
  const redirectUrl = router.query.redirect as string;

  return (
    <Center w="100%" h="100vh">
      <VStack spacing="12">
        <ZipperLogo />
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl={`/auth/success?redirect_url=${redirectUrl || '/'}`}
        />
      </VStack>
    </Center>
  );
};

export default SignInPage;

SignInPage.skipAuth = true;
SignInPage.getLayout = (page) => <NoHeaderLayout>{page}</NoHeaderLayout>;
