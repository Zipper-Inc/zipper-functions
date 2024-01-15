import {
  successResponse,
  methodNotAllowed,
  createOmniApiHandler,
} from '~/server/utils/omni.utils';
import { HttpMethod } from '@zipper/types';
import { buildAndStoreApplet } from '~/utils/eszip-build-applet';
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
    if (connectorData?.clientId) {
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
    const app = await prisma.app.findFirst({
      where: { id: script.appId },
      include: { scripts: true },
    });

    if (!app) throw new Error(`App not found for script ${script.id}`);

    const { hash } = await buildAndStoreApplet({ app });
    if (hash !== app.playgroundVersionHash) {
      // update the playground hash to use the new version
      await prisma.app.update({
        where: { id: app.id },
        data: { playgroundVersionHash: hash },
      });
    }
  }
};

export default createOmniApiHandler(async (req, res) => {
  switch (req.method) {
    case HttpMethod.GET:
      await script();
      return successResponse({
        res,
        status: 200,
        body: {
          data: [],
          ok: true,
        },
      });
    default:
      return methodNotAllowed({ method: req.method, res });
  }
});
