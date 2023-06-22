import { FC } from 'react';
import { useUser } from '~/hooks/use-user';

interface Props {
  children?: React.ReactNode;
}

export const SignedIn: FC<Props> = (props) => {
  const { isSignedIn } = useUser();

  return <>{isSignedIn && <>{props.children}</>}</>;
};

export default SignedIn;
