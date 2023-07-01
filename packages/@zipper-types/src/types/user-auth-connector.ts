export type ConnectorType = 'github' | 'slack' | 'openai' | 'notion';

export type UserAuthConnector = {
  type: ConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  clientId?: string;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: Required<{ metadata: any }>[];
};
