/**
 * This file contains the root router of your tRPC-backend
 */
import { createRouter } from '../createRouter';
import superjson from 'superjson';
import { appRouter } from './app.router';
import { scriptRouter } from './script.router';
import { appEventRouter } from './appEvent.router';
import { secretRouter } from './secret.router';
import { scheduleRouter } from './schedule.router';
import { appRunRouter } from './appRun.router';
import { userRouter } from './user.router';
import { appEditorRouter } from './appEditor.router';
import { appConnectorRouter } from './appConnector.router';
import { organizationSlugRouter } from './organizationSlug.router';

/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */
export const trpcRouter = createRouter()
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
  /**
   * Add a health check endpoint to be called with `/api/trpc/healthz`
   */
  .query('healthz', {
    async resolve() {
      return 'yay!';
    },
  })
  .merge('app.', appRouter)
  .merge('appConnector.', appConnectorRouter)
  .merge('appEditor.', appEditorRouter)
  .merge('appEvent.', appEventRouter)
  .merge('appRun.', appRunRouter)
  .merge('organizationSlug.', organizationSlugRouter)
  .merge('secret.', secretRouter)
  .merge('script.', scriptRouter)
  .merge('schedule.', scheduleRouter)
  .merge('user.', userRouter);

export type AppRouter = typeof trpcRouter;
