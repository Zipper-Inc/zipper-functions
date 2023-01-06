/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from '@clerk/nextjs/dist/api';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createContextInner = async ({ user }: { user: User | null }) => {
  return { user };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: trpcNext.CreateNextContextOptions) {
  async function getUser() {
    // get userId from request
    const { userId } = getAuth(opts.req);
    // get full user object
    const user = userId ? await clerkClient.users.getUser(userId) : null;
    return user;
  }

  const user = await getUser();

  return await createContextInner({ user });
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
