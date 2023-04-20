import { UserAuthConnector } from '@zipper/types';
import { encryptToHex } from '@zipper/utils';

export const getConnectorsAuthUrl = ({
  userAuthConnectors,
  userId,
  appId,
  host,
}: {
  userAuthConnectors: UserAuthConnector[];
  userId: string;
  appId: string;
  host?: string;
}) => {
  const connectorsMissingAuth = userAuthConnectors
    .filter((c) => c.appConnectorUserAuths.length === 0)
    .map((c) => c.type);

  let slackAuthUrl: string | null = null;
  let githubAuthUrl: string | null = null;

  if (connectorsMissingAuth.includes('slack')) {
    const slackConnector = userAuthConnectors.find((c) => c.type === 'slack');
    if (slackConnector) {
      const state = encryptToHex(
        `${appId}::${
          process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
        }${host}::${userId}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://slack.com/oauth/v2/authorize');
      url.searchParams.set(
        'client_id',
        slackConnector.clientId || process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      );
      url.searchParams.set('scope', slackConnector.workspaceScopes.join(','));
      url.searchParams.set('user_scope', slackConnector.userScopes.join(','));
      url.searchParams.set('state', state);

      slackAuthUrl = url.href;
    }
  }

  if (connectorsMissingAuth.includes('github')) {
    const githubConnector = userAuthConnectors.find((c) => c.type === 'github');
    if (githubConnector) {
      const state = encryptToHex(
        `${appId}::${
          process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
        }${host}::${userId}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
      url.searchParams.set('scope', githubConnector.userScopes.join(','));
      url.searchParams.set('state', state);

      githubAuthUrl = url.href;
    }
  }
  return {
    githubAuthUrl,
    slackAuthUrl,
  };
};
