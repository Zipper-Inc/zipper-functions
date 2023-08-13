import { Connector, ConnectorId } from './createConnector';
import { githubConnector } from './github';
import { slackConnector } from './slack';
import { openaiConnector } from './openai';
import { zendeskConnector } from './zendesk';

export const connectors: Record<ConnectorId, Connector> = {
  github: githubConnector,
  slack: slackConnector,
  openai: openaiConnector,
  zendesk: zendeskConnector,
};

export default connectors;
