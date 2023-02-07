/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from '@clerk/nextjs/dist/api';
import { buildClerkProps, clerkClient, getAuth } from '@clerk/nextjs/server';
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createContextInner = async ({
  userId,
  orgId,
}: {
  userId?: string;
  orgId?: string;
}) => {
  return { userId, orgId };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: trpcNext.CreateNextContextOptions) {
  const { userId, orgId } = getAuth(opts.req);

  return await createContextInner({
    userId: userId || undefined,
    orgId: orgId || undefined,
  });
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
