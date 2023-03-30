import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const SlackStartAuth: NextPageWithLayout = () => {
  const router = useRouter();
  console.log(router.query.appId as string);
  const slackAuthURL = trpc.useQuery([
    'slackConnector.getAuthUrl',
    {
      appId: router.query.appId as string,
      scopes: {
        bot: (router.query.botScopes as string).split(','),
        user: (router.query.userScopes as string).split(','),
      },
      postInstallationRedirect: router.query.postInstallRedirect as string,
      redirectUri: router.query.redirectUri as string,
    },
  ]);

  useEffect(() => {
    if (slackAuthURL.data) {
      router.push(slackAuthURL.data.url);
    }
  }, [slackAuthURL.data]);

  return <></>;
};

export default SlackStartAuth;

SlackStartAuth.header = () => <></>;
