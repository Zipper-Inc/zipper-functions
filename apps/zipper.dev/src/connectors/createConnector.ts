import { ConnectorType } from '@zipper/types';
import { ReactElement } from 'react';

export type Connector = {
  id: ConnectorId;
  name: string;
  description?: string;
  helperText?: string;
  icon?: ReactElement;
  code?: string;
  workspaceScopes?: string[];
  userScopes?: string[];
  scopes?: string[];
  botPermissions?: string[];
  events?: string[];
};

export type ConnectorId = ConnectorType;

export const createConnector = ({
  id,
  name,
  description,
  helperText,
  code,
  icon,
  workspaceScopes,
  userScopes,
  botPermissions,
  scopes,
  events,
}: Connector): Connector => {
  return {
    id,
    name,
    description,
    helperText,
    code,
    icon,
    workspaceScopes,
    userScopes,
    botPermissions,
    scopes,
    events,
  };
};

export default createConnector;
