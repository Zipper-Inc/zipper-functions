import { Center, VStack } from '@chakra-ui/react';
import { SignUp } from '@clerk/nextjs';
import { ZipperLogo } from '@zipper/ui';

const SignUpPage = () => {
  return (
    <Center w="100%" h="100vh">
      <VStack spacing="50">
        <ZipperLogo />
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </VStack>
    </Center>
  );
};

export default SignUpPage;
