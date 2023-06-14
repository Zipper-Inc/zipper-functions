/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequestLike } from '@clerk/nextjs/dist/server/types';
import { getAuth } from '@clerk/nextjs/server';
import { captureException } from '@sentry/nextjs';
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { ServerResponse } from 'http';
import { NextApiResponse } from 'next';

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createContextInner = ({
  userId,
  orgId,
  organizations,
  req,
}: {
  userId?: string;
  orgId?: string;
  organizations?: Record<string, string>[];
  req?: RequestLike;
}) => {
  return { userId, orgId, organizations, req };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: {
  req: RequestLike;
  res: NextApiResponse | ServerResponse;
}) {
  const getAuthAndCreateContext = () => {
    const { userId, orgId, sessionClaims } = getAuth(opts.req);

    return createContextInner({
      userId: userId || undefined,
      orgId: orgId || undefined,
      organizations: sessionClaims?.organizations as Record<string, string>[],
      req: opts.req,
    });
  };

  try {
    return getAuthAndCreateContext();
  } catch (e) {
    captureException(e);
    return createContextInner({ req: opts.req });
  }
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
