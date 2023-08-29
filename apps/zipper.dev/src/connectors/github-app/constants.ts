export const code = `import { create, getNumericDate } from "https://deno.land/x/djwt@v2.2/mod.ts";

/**
 * Welcome to the GitHub App connector! In order to make API calls to the GitHub
 * API you will need to get an installation token using your app token.
 *
 * To get an app token, call the appJwt function. You can use the JWT that is
 * returned to list all the installations for your app but calling the
 * listInstallations function.
 *
 * To make API calls for a particular installation, you need an installation
 * access token which you can get by calling getInstallationAccessToken.
 *
 * You can use the installation access token and call the appRequest function
 * to query GitHub's API.
 **/


/* Get the JWT for the app. This JWT is used to get an installation token. */
export function appJwt(): Promise<string> {
  const base64Pem = Deno.env.get('GITHUB_PEM_BASE64')
  if(!base64Pem) throw new Error('GITHUB_PEM_BASE64 is not set');

  return create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: Deno.env.get('GITHUB_APP_ID'), // issuer
      iat: getNumericDate(0), // issued at time (now)
      exp: getNumericDate(5 * 60), // expiration time (in 5 minutes)
    },
    atob(base64Pem),
  );
}

/* Make a request to the GitHub API as the app. */
export async function appRequest(
  jwt: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: string
) {
  const response = await fetch(\`\${"https://api.github.com"}/\${endpoint}\`, {
    method,
    headers: {
      authorization: \`bearer \${jwt}\`,
      accept: "application/vnd.github.full+json",
    },
    body,
  });
  return await response.json();
}

export function listInstallations(jwt: string) {
  return appRequest(jwt, "app/installations", "GET");
}

/* This function is used to get an installation token using an app's JWT. */
async function getInstallationAccessToken(jwt: string, installationId: string) {
  return appRequest(
    jwt,
    \`app/installations/\${installationId}/access_tokens\`,
    "POST"
  );
}

/* Example of how to call GitHub's API using an installation token */
export async function postComment({
  jwt,
  installationId,
  owner,
  repo,
  issueNumber,
  commentBody,
}: {
  jwt: string;
  installationId: string;
  owner: string;
  repo: string;
  issueNumber: string;
  commentBody: string;
}) {
  const installationAccessToken = await getInstallationAccessToken(
    jwt,
    installationId
  );
  return appRequest(
    installationAccessToken.token,
    \`repos/\${owner}/\${repo}/issues/\${issueNumber}/comments\`,
    "POST",
    JSON.stringify({ body: commentBody })
  );
}

/* The function that will receive GitHub webhooks. You can customize the
endpoint where webhooks are sent in the GitHub App settings. */
export function handler({ ...githubWebhook }: any) {
  console.log(githubWebhook);

  return 'Webhook received';
}
`;

export const events = [
  'branch_protection_configuration',
  'branch_protection_rule',
  'check_run',
  'check_suite',
  'code_scanning_alert',
  'commit_comment',
  'create',
  'delete',
  'dependabot_alert',
  'deployment',
  'deployment_protection_rule',
  'deployment_review',
  'deployment_status',
  'deploy_key',
  'discussion',
  'discussion_comment',
  'fork',
  'gollum',
  'issues',
  'issue_comment',
  'label',
  'member',
  'membership',
  'merge_group',
  'merge_queue_entry',
  'milestone',
  'organization',
  'org_block',
  'page_build',
  'personal_access_token_request',
  'project',
  'projects_v2',
  'projects_v2_item',
  'project_card',
  'project_column',
  'public',
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'pull_request_review_thread',
  'push',
  'registry_package',
  'release',
  'repository',
  'repository_advisory',
  'repository_dispatch',
  'repository_ruleset',
  'secret_scanning_alert',
  'secret_scanning_alert_location',
  'security_and_analysis',
  'star',
  'status',
  'team',
  'team_add',
  'watch',
  'workflow_dispatch',
  'workflow_job',
  'workflow_run',
];

export const scopes = [
  // See https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes
  'actions:read',
  'actions:write',
  'actions_variables:read',
  'actions_variables:write',
  'administration:read',
  'administration:write',
  'blocking:read',
  'blocking:write',
  'checks:read',
  'checks:write',
  'codespaces:read',
  'codespaces:write',
  'codespaces_lifecycle_admin:read',
  'codespaces_lifecycle_admin:write',
  'codespaces_metadata:read',
  'codespaces_secrets:read',
  'codespaces_secrets:write',
  'codespaces_user_secrets:read',
  'codespaces_user_secrets:write',
  'contents:read',
  'contents:write',
  'dependabot_secrets:read',
  'dependabot_secrets:write',
  'deployments:read',
  'deployments:write',
  'discussions:read',
  'discussions:write',
  'emails:read',
  'emails:write',
  'environments:read',
  'environments:write',
  'followers:read',
  'followers:write',
  'gists:read',
  'gists:write',
  'git_signing_ssh_public_keys:read',
  'git_signing_ssh_public_keys:write',
  'gpg_keys:read',
  'gpg_keys:write',
  'interaction_limits:read',
  'interaction_limits:write',
  'issues:read',
  'issues:write',
  'keys:read',
  'keys:write',
  'members:read',
  'members:write',
  'merge_queues:read',
  'merge_queues:write',
  'metadata:read',
  'organization_actions_variables:read',
  'organization_actions_variables:write',
  'organization_administration:read',
  'organization_administration:write',
  'organization_announcement_banners:read',
  'organization_announcement_banners:write',
  'organization_codespaces:read',
  'organization_codespaces:write',
  'organization_codespaces_secrets:read',
  'organization_codespaces_secrets:write',
  'organization_codespaces_settings:read',
  'organization_codespaces_settings:write',
  'organization_copilot_seat_management:read',
  'organization_copilot_seat_management:write',
  'organization_custom_roles:read',
  'organization_custom_roles:write',
  'organization_dependabot_secrets:read',
  'organization_dependabot_secrets:write',
  'organization_events:read',
  'organization_hooks:read',
  'organization_hooks:write',
  'organization_personal_access_token_requests:read',
  'organization_personal_access_token_requests:write',
  'organization_personal_access_tokens:read',
  'organization_personal_access_tokens:write',
  'organization_plan:read',
  'organization_projects:admin',
  'organization_projects:read',
  'organization_projects:write',
  'organization_secrets:read',
  'organization_secrets:write',
  'organization_self_hosted_runners:read',
  'organization_self_hosted_runners:write',
  'organization_user_blocking:read',
  'organization_user_blocking:write',
  'packages:read',
  'packages:write',
  'pages:read',
  'pages:write',
  'plan:read',
  'profile:read',
  'profile:write',
  'pull_requests:read',
  'pull_requests:write',
  'repository_advisories:read',
  'repository_advisories:write',
  'repository_hooks:read',
  'repository_hooks:write',
  'repository_projects:admin',
  'repository_projects:read',
  'repository_projects:write',
  'secret_scanning_alerts:read',
  'secret_scanning_alerts:write',
  'secrets:read',
  'secrets:write',
  'security_events:read',
  'security_events:write',
  'starring:read',
  'starring:write',
  'statuses:read',
  'statuses:write',
  'team_discussions:read',
  'team_discussions:write',
  'vulnerability_alerts:read',
  'vulnerability_alerts:write',
  'watching:read',
  'watching:write',
  'workflows:read',
  'workflows:write',
];
