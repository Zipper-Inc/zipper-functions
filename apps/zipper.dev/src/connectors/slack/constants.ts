const redirectHost =
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST
    : 'https://zipper.dev';

export const code = `import { WebClient } from 'https://deno.land/x/slack_web_api@6.7.2/mod.js';
import { initApplet } from 'https://deno.land/x/zipper_client_js@v0.1.7/mod.ts';
import { SlackUserAuth } from 'https://zipper.dev/zipper-inc/slack-install-link/src/main.ts';

export const slackConnectorConfig: Partial<SlackUserAuth> = {};

// This is an Slack API client intialized with the applet developer's Slack token
// THIS CLIENT DOES NOT USE THE USER TOKEN
// All requests using this client will use the same token. Be careful if sharing publicly!
const client = new WebClient(Deno.env.get('SLACK_BOT_TOKEN'));

client.sendToChannel = async (text: string, channelName: string) => {
  return await client.chat.postMessage({
    channel: channelName,
    text,
  });
};

// The current user's Slack token is available in the context of a handler function
export const getUserClient = (userToken: string) => new WebClient(userToken);

type SlackConnectorInput = {
  action:
    | 'get-auth-url' // Install the app
    | 'get-config'; // Needed to exchange code for token
};

export async function handler(
  input: SlackConnectorInput,
  ctx: Zipper.HandlerContext,
) {
  const thisAppletPlaygroundUrl = \`${redirectHost}/\${
    ctx.appInfo.author?.organization || ctx.appInfo.author?.slug
  }/\${ctx.appInfo.slug}/src/slack-connector.ts\`;

  const config = {
    ...slackConnectorConfig,
    zipperAppId: ctx.appInfo.id,
    postInstallRedirect: thisAppletPlaygroundUrl,
  };

  switch (input.action) {
    case 'get-auth-url': {
      const link = await initApplet('slack-install-link')
        .path('link-only')
        .run(config);

      return link;
    }
    case 'get-config': {
      return config;
    }
  }
}

export default client;
`;

export const userScopes = [
  'bookmarks:read',
  'bookmarks:write',
  'calls:read',
  'calls:write',
  'channels:history',
  'channels:read',
  'channels:write',
  'channels:write.topic',
  'channels:write.invites',
  'chat:write',
  'dnd:read',
  'dnd:write',
  'email',
  'emoji:read',
  'files:read',
  'files:write',
  'groups:history',
  'groups:read',
  'groups:write',
  'groups:write.invites',
  'groups:write.topic',
  'identify',
  'identity.avatar',
  'identity.basic',
  'identity.email',
  'identity.team',
  'im:history',
  'im:read',
  'im:write',
  'links.embed:write',
  'links:read',
  'links:write',
  'mpim:history',
  'mpim:read',
  'mpim:write',
  'mpim:write.topic',
  'mpim:write.invites',
  'openid',
  'pins:read',
  'pins:write',
  'profile',
  'reactions:read',
  'reactions:write',
  'reminders:read',
  'reminders:write',
  'remote_files:read',
  'remote_files:share',
  'search:read',
  'stars:read',
  'stars:write',
  'team.preferences:read',
  'team:read',
  'usergroups:read',
  'usergroups:write',
  'users.profile:read',
  'users.profile:write',
  'users:read',
  'users:read.email',
  'users:write',
];

export const workspaceScopes = [
  'app_mentions:read',
  'bookmarks:read',
  'bookmarks:write',
  'calls:read',
  'calls:write',
  'channels:history',
  'channels:join',
  'channels:manage',
  'channels:read',
  'channels:write.topic',
  'channels:write.invites',
  'chat:write',
  'chat:write.customize',
  'chat:write.public',
  'commands',
  'conversations.connect:manage',
  'conversations.connect:read',
  'conversations.connect:write',
  'datastore.read',
  'datastore.write',
  'dnd:read',
  'emoji:read',
  'files:read',
  'files:write',
  'groups:history',
  'groups:read',
  'groups:write',
  'groups:write.invites',
  'groups:write.topic',
  'incoming-webhook',
  'im:history',
  'im:read',
  'im:write',
  'links.embed:write',
  'links:read',
  'links:write',
  'metadata.message:read',
  'mpim:history',
  'mpim:read',
  'mpim:write',
  'mpim:write.topic',
  'mpim:write.invites',
  'pins:read',
  'pins:write',
  'reactions:read',
  'reactions:write',
  'reminders:read',
  'reminders:write',
  'remote_files:read',
  'remote_files:share',
  'remote_files:write',
  'triggers:read',
  'team:read',
  'triggers:write',
  'usergroups:read',
  'usergroups:write',
  'users.profile:read',
  'users:read',
  'users:read.email',
  'users:write',
  'workflow.steps:execute',
];
