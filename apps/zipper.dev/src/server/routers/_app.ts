/**
 * This file contains the root router of your tRPC-backend
 */
import { appRouter } from './app.router';
import { scriptRouter } from './script.router';
import { secretRouter } from './secret.router';
import { scheduleRouter } from './schedule.router';
import { appRunRouter } from './appRun.router';
import { userRouter } from './user.router';
import { appEditorRouter } from './appEditor.router';
import { appConnectorRouter } from './appConnector.router';
import { resourceOwnerSlugRouter } from './resourceOwnerSlug.router';
import { slackConnectorRouter } from './slackConnector.router';
import { githubConnectorRouter } from './githubConnector.router';
import { appAccessTokenRouter } from './appAccessToken.router';
import { organizationRouter } from './organization.router';
import { versionRouter } from './version.router';
import { aiRouter } from './ai.router';
import { githubAppConnectorRouter } from './githubAppConnector.router';
import { zipperSlackIntegrationRouter } from './zipperSlackIntegration.router';
import { appLogRouter } from './appLog.router';
import { createTRPCRouter, publicProcedure } from '../root';
import { discordConnectorRouter } from './discordConnector.router';
import { notionConnectorRouter } from './notion.connector.router';
import { postgresConnectorRouter } from './postgres.connector.router';
import { mysqlConnectorRouter } from './mysql.connector.router';

export const trpcRouter = createTRPCRouter({
  healthz: publicProcedure.query(() => 'yay!'),
  app: appRouter,
  appAccessToken: appAccessTokenRouter,
  appConnector: appConnectorRouter,
  appEditor: appEditorRouter,
  appLog: appLogRouter,
  appRun: appRunRouter,
  slackConnector: slackConnectorRouter,
  zipperSlackIntegration: zipperSlackIntegrationRouter,
  githubConnector: githubConnectorRouter,
  discordConnector: discordConnectorRouter,
  githubAppConnector: githubAppConnectorRouter,
  resourceOwnerSlug: resourceOwnerSlugRouter,
  notionConnector: notionConnectorRouter,
  postgresConnector: postgresConnectorRouter,
  mysqlConnector: mysqlConnectorRouter,
  secret: secretRouter,
  script: scriptRouter,
  schedule: scheduleRouter,
  user: userRouter,
  organization: organizationRouter,
  version: versionRouter,
  ai: aiRouter,
});

export type AppRouter = typeof trpcRouter;
