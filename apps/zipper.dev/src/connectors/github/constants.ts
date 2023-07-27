export const code = `import { Octokit } from "https://cdn.skypack.dev/octokit@2.0.14?dts";

// This is an Octokit client intialized with the applet developer's GitHub token
// THIS CLIENT DOES NOT USE THE USER TOKEN
// All requests using this client will use the same token. Be careful if sharing publicly!
const client = new Octokit({
  auth: Deno.env.get("GITHUB_TOKEN"),
});

// The current user's GitHub token is available in the context of a handler function
export const getUserClient = (userToken: string) =>
  new Octokit({ auth: userToken });

export default client;

`;

export const scopes = [
  // See https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes
  'repo',
  'repo:status',
  'repo_deployment',
  'public_repo',
  'repo:invite',
  'security_events',
  'admin:repo_hook',
  'write:repo_hook',
  'read:repo_hook',
  'admin:org',
  'write:org',
  'read:org',
  'admin:public_key',
  'write:public_key',
  'read:public_key',
  'admin:org_hook',
  'gist',
  'notifications',
  'user',
  'read:user',
  'user:email',
  'user:follow',
  'project',
  'read:project',
  'delete_repo',
  'write:discussion',
  'read:discussion',
  'write:packages',
  'read:packages',
  'delete:packages',
  'admin:gpg_key',
  'write:gpg_key',
  'read:gpg_key',
  'codespace',
  'workflow',
];
