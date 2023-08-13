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
  console.log('HERE IS THE CONNECTOR ID');
  console.log(connectorId);
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
    console.log('ADD THE ZENDESK FORM!!!!');
    return <ZendeskConnectorForm appId={appId} />;
  }
  return <></>;
}
