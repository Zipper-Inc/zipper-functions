// Run using yarn ts-node src/scripts/example.script.ts

// NOTE: SLACK_CONNECTOR_V2_CODE requires .env to be set up (to get the redirectHost)
// Probably we want to run this script using Bun, since ts-node doesn't load .env
import { prisma } from '~/server/prisma';
import { code as SLACK_CONNECTOR_V2_CODE } from '~/connectors/slack/constants';
import { updateConnectorConfig } from '~/utils/connector-codemod';

const script = async () => {
  const allSlackScripts = await prisma.script.findMany({
    where: { filename: 'slack-connector.ts' },
  });

  // for each slack-connectors in scripts table:
  for (const script of allSlackScripts) {
    // - grab the client_id, bot/user scopes from the database
    const connectorData = await prisma.appConnector.findFirst({
      where: { type: 'slack', appId: script.appId },
    });

    // If there is a connector in the database, we need to add the config to the code
    if (connectorData) {
      // Add the config to the code
      const codeWithConfig = updateConnectorConfig(
        SLACK_CONNECTOR_V2_CODE,
        'slackConnectorConfig',
        {
          clientId: connectorData.clientId,
          botScopes: connectorData.workspaceScopes,
          userScopes: connectorData.userScopes,
        },
      );

      // Update the code column in the database
      await prisma.script.update({
        where: { id: script.id },
        data: { code: codeWithConfig },
      });
    } else {
      // Slack connector isnt in the database, lets just update the code to V2
      await prisma.script.update({
        where: { id: script.id },
        data: { code: SLACK_CONNECTOR_V2_CODE },
      });
    }

    // - ship a new version (playground only) // TODO: how?
  }
};

script()
  .then(() => prisma.$disconnect())
  .finally(() => process.exit(1));
