import { Connector, ConnectorId } from './createConnector';
import { githubConnector } from './github';
import { slackConnector } from './slack';
import { openaiConnector } from './openai';
import { zendeskConnector } from './zendesk';
import { githubAppConnector } from './github-app';

export const connectors: Record<ConnectorId, Connector> = {
  github: githubConnector,
  githubApp: githubAppConnector,
  slack: slackConnector,
  openai: openaiConnector,
  zendesk: zendeskConnector,
};

export default connectors;
