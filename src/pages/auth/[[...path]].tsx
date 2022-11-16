import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import SuperTokens from 'supertokens-auth-react';
import { NextPageWithLayout } from '../_app';
import { BlankLayout } from '~/components/blank-layout';

const SuperTokensComponentNoSSR = dynamic(
  new Promise((res) => res(SuperTokens.getRoutingComponent)) as any,
  { ssr: false },
);

const Auth: NextPageWithLayout = () => {
  useEffect(() => {
    if (SuperTokens.canHandleRoute() === false) {
      SuperTokens.redirectToAuth();
    }
  }, []);

  return (
    <div>
      <main>
        <SuperTokensComponentNoSSR />
      </main>
    </div>
  );
};

Auth.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;
Auth.skipAuth = true;

export default Auth;
