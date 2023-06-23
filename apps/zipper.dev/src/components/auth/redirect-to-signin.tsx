import { useEffect } from 'react';
import { useUser } from '~/hooks/use-user';

export const RedirectToSignIn = () => {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) {
      window.location.href = `/auth/signin?redirect=${encodeURIComponent(
        window.location.toString(),
      )}`;
    }
  });

  return <></>;
};

export default RedirectToSignIn;
