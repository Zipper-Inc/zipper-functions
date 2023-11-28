import { useQuery } from '@tanstack/react-query';
import { initApplet } from '@zipper-inc/client-js';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';

const SlackStartAuth: NextPageWithLayout = () => {
  const router = useRouter();
  console.log(router.query);

  const slackAuthURL = useQuery({
    queryKey: [
      'slackAuthURL',
      {
        appId: router.query.appId as string,
        botScopes: (router.query.botScopes as string).split(','),
        userScopes: (router.query.userScopes as string).split(','),
        postInstallationRedirect: router.query.postInstallRedirect as string,
        redirectUri: router.query.redirectUri as string,
      },
    ],
    queryFn: () =>
      initApplet('slack-config').run({
        appId: router.query.appId as string,
        botScopes: (router.query.botScopes as string).split(','),
        userScopes: (router.query.userScopes as string).split(','),
        postInstallationRedirect: router.query.postInstallRedirect as string,
        redirectUri: router.query.redirectUri as string,
        // TODO: Where I can get clientId & clientSecret ?
      }),
  });

  useEffect(() => {
    if (slackAuthURL.data) {
      router.push(slackAuthURL.data.url);
    }
  }, [slackAuthURL.data]);

  return <></>;
};

export default SlackStartAuth;

SlackStartAuth.header = () => <></>;
