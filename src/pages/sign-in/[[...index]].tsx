import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';

const SignInPage = () => {
  const router = useRouter();
  const redirectUrl = router.query.redirect as string;

  return (
    <SignIn
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      redirectUrl={redirectUrl || '/'}
    />
  );
};

export default SignInPage;
