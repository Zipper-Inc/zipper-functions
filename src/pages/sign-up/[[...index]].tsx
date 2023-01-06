import { SignUp } from '@clerk/nextjs';
import { useRouter } from 'next/router';

const SignUpPage = () => {
  const router = useRouter();
  const redirectUrl = router.query.redirect as string;
  return (
    <SignUp
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
      redirectUrl={redirectUrl || '/'}
    />
  );
};

export default SignUpPage;
