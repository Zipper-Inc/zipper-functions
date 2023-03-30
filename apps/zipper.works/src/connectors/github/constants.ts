export const code = `import { Octokit, App } from "https://cdn.skypack.dev/octokit?dts";

const clientGlobal = window as typeof window & {
  gitHubClient?: any;
};

export const client = clientGlobal.gitHubClient || new Octokit({
  auth: Deno.env.get("GITHUB_TOKEN"),
});

clientGlobal.gitHubClient = client;

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
