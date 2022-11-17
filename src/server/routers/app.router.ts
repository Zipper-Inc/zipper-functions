import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  scriptMain: true,
});

export const appRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      name: z.string().min(3).max(255),
    }),
    async resolve({ input }) {
      const app = await prisma.app.create({
        data: {
          ...input,
        },
        select: defaultSelect,
      });

      if (!app) return;

      const defaultCode = '{}';

      const scriptMain = await prisma.scriptMain.create({
        data: {
          app: { connect: { id: app.id } },
          script: {
            create: {
              code: defaultCode,
              name: 'main',
              filename: 'main.ts',
              appId: app.id,
              order: 0,
            },
          },
        },
      });

      return { ...app, scriptMain };
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
        where: { isPrivate: false },
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
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
        },
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
        include: { scripts: true, scriptMain: true },
      });

      const fork = await prisma.app.create({
        data: {
          name: app.name,
          description: app.description,
          parentId: app.id,
        },
        select: defaultSelect,
      });

      app.scripts.map(async (script, i) => {
        const forkScript = await prisma.script.create({
          data: {
            ...script,
            id: undefined,
            inputSchema: JSON.stringify(script.inputSchema),
            outputSchema: JSON.stringify(script.outputSchema),
            appId: fork.id,
            order: i,
          },
        });

        if (script.id === app.scriptMain?.scriptId) {
          await prisma.scriptMain.create({
            data: {
              app: { connect: { id: fork.id } },
              script: { connect: { id: forkScript.id } },
            },
          });
        }
      });

      return prisma.app.findUniqueOrThrow({
        where: { id: fork.id },
        select: defaultSelect,
      });
    },
  })
  // update
  .mutation('edit', {
    input: z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(3).max(255).optional(),
        description: z.string().optional(),
        isPrivate: z.boolean().optional(),
        scripts: z
          .array(
            z.object({
              id: z.string().uuid(),
              data: z.object({
                name: z.string().min(3).max(255),
                description: z.string(),
                code: z.string(),
              }),
            }),
          )
          .optional(),
      }),
    }),
    async resolve({ input }) {
      const { id, data } = input;
      const { scripts, ...rest } = data;

      await prisma.app.update({
        where: { id },
        data: { updatedAt: new Date(), ...rest },
        select: defaultSelect,
      });

      if (scripts) {
        await Promise.all(
          scripts.map(async (script) => {
            const { id, data } = script;
            await prisma.script.update({ where: { id }, data });
          }),
        );
      }

      return prisma.app.findUniqueOrThrow({
        where: { id },
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
