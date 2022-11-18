/* eslint-disable @typescript-eslint/no-unused-vars */
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import SuperTokens from 'supertokens-node/lib/build/supertokens';
import Session from 'supertokens-node/recipe/session';
import { backendConfig } from '~/config/backendConfig';

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export async function createContextInner(superTokenId?: string) {
  return { superTokenId };
}

export type Context = trpc.inferAsyncReturnType<typeof createContextInner>;

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: trpcNext.CreateNextContextOptions) {
  try {
    SuperTokens.init(backendConfig());
    const session = await Session.getSession(opts.req, opts.res);
    return createContextInner(session?.getUserId());
  } catch (error) {
    console.log(error);
    return createContextInner();
  }
}
