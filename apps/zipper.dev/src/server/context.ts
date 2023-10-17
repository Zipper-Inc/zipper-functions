/* eslint-disable @typescript-eslint/no-unused-vars */
import { captureException } from '@sentry/nextjs';
import { inferAsyncReturnType } from '@trpc/server';

import { ServerResponse } from 'http';
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';

import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

type RequestLike = GetServerSidePropsContext['req'] | NextApiRequest;
type ResponseLike = NextApiResponse | ServerResponse;

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
  organizations?: Record<string, string>;
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
  res: ResponseLike;
}) {
  const getAuthAndCreateContext = async () => {
    const session = await getServerSession(opts.req, opts.res, authOptions);
    const orgMems: Record<string, string> = {};
    session?.organizationMemberships?.forEach((m) => {
      orgMems[m.organization.id] = m.role;
    });

    return createContextInner({
      orgId: session?.currentOrganizationId || undefined,
      userId: session?.user?.id || undefined,
      organizations: orgMems,
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

export type Context = inferAsyncReturnType<typeof createContext>;
