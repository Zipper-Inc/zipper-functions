import connectors from '~/connectors/connectors';
import { ConnectorId } from '~/connectors/createConnector';

export function ConnectorForm({
  connectorId,
  appId,
}: {
  connectorId: ConnectorId;
  appId: string;
}) {
  return connectors[connectorId]?.render(appId);
}
