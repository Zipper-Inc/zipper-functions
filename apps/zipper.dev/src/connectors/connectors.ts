import { Connector, ConnectorId } from './createConnector';
import { githubConnector } from './github';
import { slackConnector } from './slack';
import { openaiConnector } from './openai';
import { notionConnector } from './notion';

export const connectors: Record<ConnectorId, Connector> = {
  github: githubConnector,
  slack: slackConnector,
  openai: openaiConnector,
  notion: notionConnector,
};

export default connectors;
