export type ConnectorType = 'github' | 'slack';

export type UserAuthConnector = {
  type: ConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: Required<{ metadata: any }>[];
};
