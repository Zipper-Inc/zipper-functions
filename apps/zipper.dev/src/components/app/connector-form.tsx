import { ConnectorId } from '~/connectors/createConnector';
import GitHubConnectorForm from '~/connectors/github';
import OpenAIConnectorForm from '~/connectors/openai';
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
  return <></>;
}
