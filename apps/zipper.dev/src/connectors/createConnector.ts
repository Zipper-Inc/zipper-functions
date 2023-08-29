import { ConnectorType } from '@zipper/types';
import { ReactElement } from 'react';

export type Connector = {
  id: ConnectorId;
  name: string;
  description?: string;
  icon?: ReactElement;
  code?: string;
  workspaceScopes?: string[];
  userScopes?: string[];
  events?: string[];
};

export type ConnectorId = ConnectorType;

export const createConnector = ({
  id,
  name,
  description,
  code,
  icon,
  workspaceScopes,
  userScopes,
  events,
}: Connector): Connector => {
  return {
    id,
    name,
    description,
    code,
    icon,
    workspaceScopes,
    userScopes,
    events,
  };
};

export default createConnector;
