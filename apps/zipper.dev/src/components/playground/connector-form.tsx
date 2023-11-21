import { ConnectorId } from '~/connectors/createConnector';
import DiscordConnectorForm from '~/connectors/discord';
import GitHubConnectorForm from '~/connectors/github';
import GitHubAppConnectorForm from '~/connectors/github-app';
import NotionConnectorForm from '~/connectors/notion';
import OpenAIConnectorForm from '~/connectors/openai';
import PostgresConnectorForm from '~/connectors/postgres';
import SlackConnectorForm from '~/connectors/slack';
import ZendeskConnectorForm from '~/connectors/zendesk';

export function ConnectorForm({
  connectorId,
  appId,
}: {
  connectorId: ConnectorId;
  appId: string;
}) {
  if (connectorId === 'slack') {
    return <SlackConnectorForm appId={appId} />;
  }

  if (connectorId === 'github') {
    return <GitHubConnectorForm appId={appId} />;
  }

  if (connectorId === 'openai') {
    return <OpenAIConnectorForm appId={appId} />;
  }

  if (connectorId === 'zendesk') {
    return <ZendeskConnectorForm appId={appId} />;
  }

  if (connectorId === 'github-app') {
    return <GitHubAppConnectorForm appId={appId} />;
  }

  if (connectorId === 'postgres') {
    return <PostgresConnectorForm appId={appId} />;
  }

  if (connectorId === 'discord') {
    return <DiscordConnectorForm appId={appId} />;
  }

  if (connectorId === 'notion') {
    return <NotionConnectorForm appId={appId} />;
  }

  return <></>;
}
