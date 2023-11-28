export type ConnectorType =
  | 'github'
  | 'github-app'
  | 'slack'
  | 'openai'
  | 'zendesk'
  | 'discord'
  | 'notion';

export type UserAuthConnectorType = 'github' | 'slack';

export type Connector = {
  type: ConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  clientId?: string;
  userScopes: string[];
  workspaceScopes: string[];
};

export type UserAuthConnector = Connector & {
  type: UserAuthConnectorType;
  appConnectorUserAuths: Required<{
    encryptedAccessToken: string;
    connectorType: string;
    metadata: any;
  }>[];
};
