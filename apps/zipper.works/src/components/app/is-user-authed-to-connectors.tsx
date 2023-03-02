import { Image } from '@chakra-ui/react';
import { AppConnector } from '@prisma/client';
import { getCookie } from 'cookies-next';
import Link from 'next/link';
import { FC, ReactNode, useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

const IsUserAuthedToConnectors: FC<{
  appId: string;
  children: ReactNode;
  connectors: Pick<
    AppConnector,
    'isUserAuthRequired' | 'userScopes' | 'type'
  >[];
}> = ({ appId, connectors, children }) => {
  // state to hold the connectors that require user auth
  const [userAuthConnectors, setUserAuthConnectors] = useState<
    Partial<AppConnector>[] | undefined
  >([]);

  // state to hold whether user needs to authenticate with slack
  const [slackAuthRequired, setSlackAuthRequired] = useState(false);

  // get the existing Slack connector data from the database
  const slackConnector = trpc.useQuery(['connector.slack.get', { appId }], {
    enabled: slackAuthRequired,
  });

  // get the Slack auth URL -- if required --from the backend
  // (it includes an encrypted state value that links the auth request to the app)
  const slackAuthURL = trpc.useQuery(
    [
      'connector.slack.getAuthUrl',
      {
        appId,
        scopes: {
          bot: slackConnector.data?.workspaceScopes || [],
          user: slackConnector.data?.userScopes || [],
        },
        redirectTo: window.location.href,
      },
    ],
    {
      enabled: slackConnector.isFetched,
    },
  );

  // state to hold the connectors that require user auth and have a cookie set.
  // value will be null if there is no cookie set
  const [connectorsWithAssociatedCookie, setConnectorsWithAssociatedCookie] =
    useState<Record<string, string | null>>({});

  // filter out the connectors that require user auth and have user scopes attached
  useEffect(() => {
    setUserAuthConnectors(
      connectors.filter(
        (connector) =>
          connector.isUserAuthRequired && connector.userScopes.length > 0,
      ),
    );
  }, []);

  // loop through the connectors that require user auth and check if there is a cookie set
  // cookies have a naming convention of {appId}::{connectorType}
  useEffect(() => {
    userAuthConnectors?.forEach((c) => {
      const cookie = getCookie(`${appId}::${c.type}`);

      if (!cookie) {
        if (c.type === 'slack') {
          setSlackAuthRequired(true);
        }
      }

      setConnectorsWithAssociatedCookie((prevConnectorsWithCookies) => {
        return {
          ...prevConnectorsWithCookies,
          [`${c.type}`]: cookie?.toString() || null,
        };
      });
    });
  }, [userAuthConnectors]);

  if (
    (userAuthConnectors && userAuthConnectors.length === 0) ||
    Object.keys(connectorsWithAssociatedCookie).filter(
      (c) => connectorsWithAssociatedCookie[c] === null,
    ).length === 0
  )
    return <>{children}</>;

  // return <>{JSON.stringify(connectorsWithCookies)}</>;
  return (
    <>
      {Object.keys(connectorsWithAssociatedCookie).map((k) => (
        <>
          {k === 'slack' && (
            <Link href={slackAuthURL.data?.url || ''}>
              <Image
                alt="Add to Slack"
                src="https://platform.slack-edge.com/img/add_to_slack.png"
                srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
              />
            </Link>
          )}
        </>
      ))}
    </>
  );
};

export default IsUserAuthedToConnectors;
