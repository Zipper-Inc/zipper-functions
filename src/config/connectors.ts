type ConnectorSecretConfig = {
  type: 'secret';
  name: string;
  description?: string;
  envVar: string;
};

type ConnectorStringConfig = {
  type: 'string';
  name: string;
  description?: string;
  default?: string;
};

export type Connector = {
  id: 'github' | 'slack';
  name: string;
  schema: {
    token?: ConnectorSecretConfig;
    clientId?: ConnectorStringConfig;
    clientSecret?: ConnectorSecretConfig;
    scopes?: ConnectorStringConfig;
  };
  clientName?: string;
  code: string;
};

// const githubConnectorCode = `
//     import { githubClient } from "https://zipper-apiclient-server.onrender.com/github/index.ts";

//     const client = new githubClient({
//       TOKEN: Zipper.env.get("GITHUB_TOKEN"),
//       HEADERS: {
//         "keep-alive": "true",
//       },
//     });

//     const githubGlobal = window as typeof window & {
//       githubClient?: any;
//     };

//     export const githubClient = githubGlobal.githubClient || client;
// `;

export const connectors: Connector[] = [
  {
    id: 'github',
    name: 'GitHub',
    schema: {
      token: {
        type: 'secret',
        name: 'GitHub Personal Access Token',
        description:
          'Create a Personal Access Token at github.com/settings/tokens',
        envVar: 'GITHUB_TOKEN',
      },
    },
    clientName: 'githubClient',
    code: `
import { Octokit, App } from "https://cdn.skypack.dev/octokit?dts";

const clientGlobal = window as typeof window & {
  gitHubClient?: any;
};

export default const client = clientGlobal.gitHubClient || new Octokit({
  auth: Deno.env.get("GITHUB_TOKEN"),
}).rest;

clientGlobal.gitHubClient = client;
    `,
  },
  {
    id: 'slack',
    name: 'Slack',
    schema: {
      clientId: { type: 'string', name: 'Slack Client ID' },
      clientSecret: {
        type: 'secret',
        envVar: 'SLACK_CLIENT_SECRET',
        name: 'Slack Client Secret',
      },
      scopes: { type: 'string', default: 'chat:write', name: 'OAuth scopes' },
    },
    code: ``,
  },
];
