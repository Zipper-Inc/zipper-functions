import { ConnectorId } from '~/connectors/createConnector';
import GitHubConnectorForm from '~/connectors/github';
import NotionConnectorForm from '~/connectors/notion';
import OpenAIConnectorForm from '~/connectors/openai';
import SlackConnectorForm from '~/connectors/slack';

const connectors: (appId: string) => Record<ConnectorId, JSX.Element> = (
  appId: string,
) => ({
  slack: <SlackConnectorForm appId={appId} />,
  github: <GitHubConnectorForm appId={appId} />,
  openai: <OpenAIConnectorForm appId={appId} />,
  notion: <NotionConnectorForm appId={appId} />,
});

export function ConnectorForm({
  connectorId,
  appId,
}: {
  connectorId: ConnectorId;
  appId: string;
}) {
  return connectors(appId)[connectorId];
}
