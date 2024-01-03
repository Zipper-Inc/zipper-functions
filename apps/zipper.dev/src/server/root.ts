import { TRPCError, initTRPC, inferAsyncReturnType } from '@trpc/server';
import superjson from 'superjson';
import { hasOrgAdminPermission } from './utils/authz.utils';
import { getServerAuthSession } from '~/pages/api/auth/[...nextauth]';

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = (await getServerAuthSession()) || undefined;
  const orgMems: Record<string, string> = {};
  session?.organizationMemberships?.forEach((m) => {
    orgMems[m.organization.id] = m.role;
  });

  return {
    orgId: session?.currentOrganizationId || undefined,
    userId: session?.user?.id || undefined,
    organizations: orgMems,
    session,
    ...opts,
  };
};

export type Context = inferAsyncReturnType<typeof createTRPCContext>;

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  // Optional:
  // errorFormatter(opts) {
  //   const { shape } = opts;
  //   return {
  //     ...shape,
  //     data: {
  //       ...shape.data,
  //     },
  //   };
  // },
});

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
