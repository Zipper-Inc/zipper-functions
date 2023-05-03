import { ConnectorType } from '@zipper/types';
import { ReactElement } from 'react';

export type Connector = {
  id: ConnectorId;
  name: string;
  icon?: ReactElement;
  code?: string;
  workspaceScopes?: string[];
  userScopes?: string[];
};

export type ConnectorId = ConnectorType;

export const createConnector = ({
  id,
  name,
  code,
  icon,
  workspaceScopes,
  userScopes,
}: Connector): Connector => {
  return {
    id,
    name,
    code,
    icon,
    workspaceScopes,
    userScopes,
  };
};

export default createConnector;
