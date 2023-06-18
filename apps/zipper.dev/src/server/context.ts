/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequestLike } from '@clerk/nextjs/dist/server/types';
import { getAuth } from '@clerk/nextjs/server';
import { captureException } from '@sentry/nextjs';
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { ServerResponse } from 'http';
import { NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '~/pages/api/auth/[...nextauth]';

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createContextInner = ({
  userId,
  nextAuthUserId,
  orgId,
  organizations,
  req,
}: {
  userId?: string;
  nextAuthUserId?: string;
  orgId?: string;
  organizations?: Record<string, string>[];
  req?: RequestLike;
}) => {
  return { userId, nextAuthUserId, orgId, organizations, req };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: {
  req: RequestLike;
  res: NextApiResponse | ServerResponse;
}) {
  const getAuthAndCreateContext = async () => {
    const { userId, orgId, sessionClaims } = getAuth(opts.req);
    const token = await getToken({ req: opts.req });

    return createContextInner({
      userId: userId || undefined,
      orgId: orgId || undefined,
      nextAuthUserId: token?.sub || undefined,
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
