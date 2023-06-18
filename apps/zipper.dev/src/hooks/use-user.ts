import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const useOrganizationList = () => {
  const session = useSession();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<
    | { name?: string | null; email?: string | null; image?: string | null }
    | undefined
  >();

  useEffect(() => {
    if (session.status === 'authenticated') {
      console.log(session.data);
      setIsSignedIn(true);
      setUser(session.data.user);
    }

    if (session.status !== 'loading') {
      setIsLoaded(true);
    }
  }, [session.status, session.data]);

  return {
    isLoaded,
    isSignedIn,
    user,
  };
};
