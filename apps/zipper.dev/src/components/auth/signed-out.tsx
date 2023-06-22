import { FC } from 'react';
import { useUser } from '~/hooks/use-user';

interface Props {
  children?: React.ReactNode;
}

export const SignedOut: FC<Props> = (props) => {
  const { isSignedIn, isLoaded } = useUser();

  return <>{isLoaded && !isSignedIn && <>{props.children}</>}</>;
};

export default SignedOut;
