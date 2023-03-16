export const code = `import { Octokit, App } from "https://cdn.skypack.dev/octokit?dts";

const clientGlobal = window as typeof window & {
  gitHubClient?: any;
};

export const client = clientGlobal.gitHubClient || new Octokit({
  auth: Deno.env.get("GITHUB_TOKEN"),
}).rest;

clientGlobal.gitHubClient = client;

export default client;
`;
