import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { createScriptHash } from '../utils/scripts.utils';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  description: true,
  createdAt: true,
});

export const appRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      name: z.string().min(3).max(255),
    }),
    async resolve({ input }) {
      return prisma.app.create({
        data: { ...input },
        select: defaultSelect,
      });
    },
  })
  // read
  .query('all', {
    async resolve() {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.app.findMany({
        select: defaultSelect,
      });
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      return prisma.app.findFirstOrThrow({
        where: {
          id: input.id,
        },
        select: defaultSelect,
      });
    },
  })
  // update
  .mutation('fork', {
    input: z.object({
      id: z.string().uuid(),
    }),
    async resolve({ input }) {
      const { id } = input;

      const app = await prisma.app.findFirstOrThrow({
        where: { id },
        include: { scripts: true },
      });

      const fork = await prisma.app.create({
        data: {
          name: app.name,
          description: app.description,
        },
        select: defaultSelect,
      });

      app.scripts.map(async (script) => {
        await prisma.script.create({
          data: {
            ...script,
            inputSchema: JSON.stringify(script.inputSchema),
            outputSchema: JSON.stringify(script.outputSchema),
            hash: await createScriptHash({ ...script, appId: fork.id }),
            parentHash: script.hash,
            appId: fork.id,
          },
        });
      });

      return fork;
    },
  })
  // update
  .mutation('edit', {
    input: z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(3).max(255),
      }),
    }),
    async resolve({ input }) {
      const { id, data } = input;

      return prisma.app.update({
        where: { id },
        data,
        select: defaultSelect,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      await prisma.app.deleteMany({
        where: {
          id: input.id,
        },
      });

      return {
        id: input.id,
      };
    },
  });
