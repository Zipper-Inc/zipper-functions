export const code = `import {
  Client,
  Intents,
  Message,
} from "https://deno.land/x/harmony@v2.6.0/mod.ts";

/**
* This is an Discord API client intialized with the applet developer's Discord Token
* WARNING: THIS CLIENT DOES NOT USE THE USER TOKEN
* All requests using this client will use the same token. Be careful if sharing publicly!
*/
const client = new Client();

client.on("messageCreate", (msg: Message): void => {
  const content = msg.content;
});

const token = Deno.env.get("DISCORD_BOT_TOKEN");

client.connect(token, Intents.None);

export default client;
`;

export const workspaceScopes = [
  'identify',
  'email',
  'connections',
  'guilds',
  'guilds.join',
  'guilds.members.read',
  'gdm.join',
  'rpc',
  'rpc.notifications.read',
  'rpc.voice.read',
  'rpc.voice.write',
  'rpc.video.read',
  'rpc.video.write',
  'rpc.screenshare.read',
  'rpc.screenshare.write',
  'rpc.activities.write',
  'bot',
  'webhook.incoming',
  'messages.read',
  'applications.builds.upload',
  'applications.builds.read',
  'applications.store.update',
  'activities.read',
  'applications.commands',
  'applications.entitlements',
  'activities.write',
  'relationships.read',
  '0001',
  'voice',
  'dm_channels.read',
  'applications.commands.permissions.update',
  'role_connections.write',
];
