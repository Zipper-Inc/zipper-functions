import { Connector, ConnectorId } from './createConnector';
import { githubConnector } from './github.connector';
import { slackConnector } from './slack';

export const connectors: Record<ConnectorId, Connector> = {
  github: githubConnector,
  slack: slackConnector,
};

export default connectors;
