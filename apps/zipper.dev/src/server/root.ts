import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';
import { hasOrgAdminPermission } from './utils/authz.utils';
import { ZodError } from 'zod';
import { getSession } from 'next-auth/react';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { Session } from 'next-auth';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCContext = async (
  opts: Partial<CreateNextContextOptions>,
) => {
  const session = await getSession({ req: opts.req });

  return {
    session,
  };
};

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

const enforceOrgAdmin = t.middleware(async ({ ctx, next }) => {
  const isAdmin = await hasOrgAdminPermission(ctx);

  if (!ctx.orgId || !isAdmin) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      orgId: ctx.orgId,
    },
  });
});

/**
 * We recommend only exporting the functionality that we
 * use so we can enforce which base procedures should be used
 **/
export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
export const adminProcedure = t.procedure.use(enforceOrgAdmin);
