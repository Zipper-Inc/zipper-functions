import { Context } from './context';
import * as trpc from '@trpc/server';

/**
 * Helper function to create a router with context
 */
export function createRouter() {
  return trpc.router<Context>();
}

// export function createProtectedRouter() {
//   return trpc.router<Context>().middleware(({ ctx, next }) => {
//     if (!ctx.user) {
//       throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
//     }
//     return next({
//       ctx: {
//         ...ctx,
//         // infers that `user` is non-nullable to downstream procedures
//         user: ctx.user,
//       },
//     });
//   });
// }
