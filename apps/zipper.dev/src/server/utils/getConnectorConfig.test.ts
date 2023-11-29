import { getSlackConfig } from './getConnectorConfig';
test('should retrieve slack connector configuration', async () => {
  // get slack-connector file code
  const script = {
    code: `
    import { WebClient } from "https://deno.land/x/slack_web_api@6.7.2/mod.js";


export const slackConnectorConfig = {
  "clientId": "6057413030630.6064723005682",
  "userScopes": [
    "bookmarks:read"
  ],
  "botScopes": [
    "app_mentions:read"
  ]
}

// export const slackConnectorConfig = {
//   clientId: undefined
//   userScopes: [],
//   workspaceScopes: [],
// }



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

export default client;
    `,
  };
  const slackConfigText = getSlackConfig(script?.code || '');
  expect(slackConfigText).toEqual({
    clientId: '6057413030630.6064723005682',
    userScopes: ['bookmarks:read'],
    botScopes: ['app_mentions:read'],
  });
});
