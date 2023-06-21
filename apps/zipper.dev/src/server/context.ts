/* eslint-disable @typescript-eslint/no-unused-vars */
import { captureException } from '@sentry/nextjs';
import * as trpc from '@trpc/server';
import { ServerResponse } from 'http';
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { getToken } from 'next-auth/jwt';

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
    const token = await getToken({ req: opts.req });
    const orgMems: Record<string, string> = {};
    token?.organizationMemberships?.forEach((m) => {
      orgMems[m.organization.id] = m.role;
    });

    return createContextInner({
      orgId: token?.currentOrganizationId || undefined,
      userId: token?.sub || undefined,
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

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
