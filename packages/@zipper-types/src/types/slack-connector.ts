export type SlackAuthAccessErrorResponse = {
  ok: false;
  error: string;
};

type SlackConnectorMetadata = {
  ok: true;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    name: string;
    id: string;
  };
  enterprise: {
    name: string;
    id: string;
  };
  authed_user: {
    id: string;
    scope: string;
  };
};

export type SlackAuthAccessSuccessfulResponse = SlackConnectorMetadata & {
  access_token: string;
  token_type: string;
  authed_user: SlackConnectorMetadata['authed_user'] & {
    access_token: string;
    token_type: string;
  };
};

export type SlackAuthTestErrorResponse = {
  ok: false;
  error: string;
};

export type SlackConnectorUserAuthMetadata = {
  ok: true;
  url: string;
  team: string;
  user: string;
  team_id: string;
  user_id: string;
};
