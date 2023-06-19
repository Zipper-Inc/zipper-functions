import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export const SignInButton = () => {
  const router = useRouter();
  return (
    <Button
      colorScheme="purple"
      onClick={() => {
        router.push(
          `/auth/signin?redirect=${encodeURIComponent(
            window.location.toString(),
          )}`,
        );
      }}
    >
      Sign In
    </Button>
  );
};

export default SignInButton;
