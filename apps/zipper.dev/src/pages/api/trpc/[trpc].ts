/**
 * This file contains tRPC's HTTP response handler
 */
import { captureException } from '@sentry/nextjs';
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';

import { createContext } from '~/server/context';
import { trpcRouter } from '~/server/routers/_app';

export default createNextApiHandler({
  router: trpcRouter,
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
  /**
   * @link https://trpc.io/docs/error-handling
   */
  onError(data) {
    const { error, type, path, input, req } = data;
    console.log('------------------------');
    console.log(`Error below happened here: ${type} -> ${path}`);
    console.log('Inputs: ', input);
    console.log('------------------------');
    if (error.code !== 'UNAUTHORIZED') {
      captureException(error, { extra: data });
      console.error(error);
    } else {
      console.log(data);
    }
    // if (error.code === 'INTERNAL_SERVER_ERROR') {
    //   // send to bug reporting
    //   console.error('Something went wrong', error);
    // }
  },
  /**
   * Enable query batching
   */
  batching: {
    enabled: true,
  },
  /**
   * @link https://trpc.io/docs/caching#api-response-caching
   */
  // responseMeta() {
  //   // ...
  // },
});
