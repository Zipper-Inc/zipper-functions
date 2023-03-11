export type UserAuthConnector = {
  type: string;
  appId: string;
  isUserAuthRequired: boolean;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: Required<{ metadata: any }>[];
};
