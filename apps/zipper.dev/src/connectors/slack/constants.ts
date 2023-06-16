export const code = `import { WebClient } from "https://deno.land/x/slack_web_api@6.7.2/mod.js";

const client = new WebClient(Deno.env.get('SLACK_BOT_TOKEN'));

client.sendToChannel = async (text, channelName) => {
  return await client.chat.postMessage({
    channel: channelName,
    text,
  });
};

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
  'chat:write',
  'chat:write.customize',
  'chat:write.public',
  'commands',
  'conversations.connect:manage',
  'conversations.connect:read',
  'conversations.connect:write',
  'dnd:read',
  'emoji:read',
  'files:read',
  'files:write',
  'groups:history',
  'groups:read',
  'groups:write',
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
];
