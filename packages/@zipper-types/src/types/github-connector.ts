export type GitHubAuthTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

export type GithubConnectorUserAuthMetadata = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
};

export type GithubConnectorAuthMetadata = {
  id: number;
  url: string;
  scopes: string[] | null;
  app: {
    url: string;
    name: string;
    client_id: string;
  };
  note: string;
  note_url: string;
  updated_at: string;
  created_at: string;
  fingerprint: string;
  expires_at: string;
  user: GithubConnectorUserAuthMetadata;
};

export type GitHubCheckTokenResponse = GithubConnectorAuthMetadata & {
  token: string;
  token_last_eight: string;
  hashed_token: string;
};
