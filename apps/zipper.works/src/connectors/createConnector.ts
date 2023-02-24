import { ReactElement } from 'react';

export type Connector = {
  id: ConnectorId;
  name: string;
  icon?: ReactElement;
  code?: string;
};

export type ConnectorId = 'github' | 'slack';

export const createConnector = ({
  id,
  name,
  code,
  icon,
}: Connector): Connector => {
  return {
    id,
    name,
    code,
    icon,
  };
};

export default createConnector;
