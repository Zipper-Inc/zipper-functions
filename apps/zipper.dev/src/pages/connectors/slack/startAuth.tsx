import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const SlackStartAuth: NextPageWithLayout = () => {
  const router = useRouter();
  const slackAuthURL = trpc.slackConnector.getAuthUrl.useQuery({
    appId: router.query.appId as string,
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
