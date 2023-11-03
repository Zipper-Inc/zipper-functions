export type ConnectorType =
  | 'github'
  | 'github-app'
  | 'slack'
  | 'openai'
  | 'zendesk'
  | 'discord';

export type UserAuthConnectorType = 'github' | 'slack' | 'discord';

export type UserAuthConnector = {
  type: UserAuthConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  clientId?: string;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: Required<{
    encryptedAccessToken: string;
    connectorType: string;
    metadata: any;
  }>[];
};
