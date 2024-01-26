import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextResponse, type NextRequest } from 'next/server';

// import { env } from '@/env';
import { trpcRouter as appRouter } from '~/server/routers/_app';
import { createTRPCContext } from '~/server/root';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (args: CreateNextContextOptions) => {
  return createTRPCContext({ ...args });
};

const handler = (req: NextRequest, res: NextResponse) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    createContext: async () => await createContext({ req, res }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
