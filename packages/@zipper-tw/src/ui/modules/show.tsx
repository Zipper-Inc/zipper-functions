import { type ReactNode } from 'react';

interface ShowProps {
  when: boolean;
  fallback?: any;
  children: ReactNode;
}

function Show(props: ShowProps) {
  if (!!props.fallback && props.when === false) {
    return <>{props.fallback}</>;
  }

  if (props.when === true) {
    return <>{props.children}</>;
  }

  return null;
}

export { Show };
