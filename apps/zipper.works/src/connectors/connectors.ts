import { ReactElement } from 'react';
import { Connector, ConnectorId } from './createConnector';
import GitHubConnector from './github';
import SlackConnector from './slack';

type ConnectorWithComponent = Connector & {
  render: (appId: string) => ReactElement;
};

export const connectors: Record<ConnectorId, ConnectorWithComponent> = {
  github: GitHubConnector,
  slack: SlackConnector,
};

export default connectors;
