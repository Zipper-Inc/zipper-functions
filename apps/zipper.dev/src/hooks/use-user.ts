import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { SessionUser } from '~/pages/api/auth/[...nextauth]';

export const useUser = () => {
  const session = useSession();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | undefined>();

  useEffect(() => {
    if (session.status === 'authenticated') {
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
