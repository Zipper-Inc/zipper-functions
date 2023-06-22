import { Button } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';

export const SignInButton = () => {
  return (
    <Button
      colorScheme="purple"
      onClick={() => {
        signIn();
      }}
    >
      Sign In
    </Button>
  );
};

export default SignInButton;
