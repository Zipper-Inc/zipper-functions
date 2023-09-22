/**
 * This file contains the root router of your tRPC-backend
 */
import { createRouter } from '../createRouter';
import superjson from 'superjson';
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
import { createTRPCRouter, mergeRouters, publicProcedure } from '../root';

/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */
export const legacyRouter = createRouter()
  /**
   * Add data transformers
   * @link https://trpc.io/docs/data-transformers
   */
  .transformer(superjson)
  /**
   * Optionally do custom error (type safe!) formatting
   * @link https://trpc.io/docs/error-formatting
   */
  // .formatError(({ shape, error }) => { })
  .merge('app.', appRouter)
  .merge('appAccessToken.', appAccessTokenRouter)
  .merge('appConnector.', appConnectorRouter)
  .merge('appEditor.', appEditorRouter)
  .merge('appLog.', appLogRouter)
  .merge('appRun.', appRunRouter)
  .merge('slackConnector.', slackConnectorRouter)
  .merge('zipperSlackIntegration.', zipperSlackIntegrationRouter)
  .merge('githubConnector.', githubConnectorRouter)
  .merge('githubAppConnector.', githubAppConnectorRouter)
  .merge('resourceOwnerSlug.', resourceOwnerSlugRouter)
  .merge('secret.', secretRouter)
  .merge('script.', scriptRouter)
  .merge('schedule.', scheduleRouter)
  .merge('user.', userRouter)
  .merge('organization.', organizationRouter)
  .merge('version.', versionRouter)
  .merge('ai.', aiRouter)
  .interop();

const newRouter = createTRPCRouter({
  healthz: publicProcedure.query(() => 'yay!'),
});

export const trpcRouter = mergeRouters(legacyRouter, newRouter);
export type AppRouter = typeof trpcRouter;
