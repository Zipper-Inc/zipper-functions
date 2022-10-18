import { Prisma } from '@prisma/client';
import { select } from 'airplane/internal/prompt';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import slugify from '~/utils/slugify';
import { createRouter } from '../createRouter';
import { createScriptHash } from '../utils/scripts.utils';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  description: true,
  createdAt: true,
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
              hash: await createScriptHash({
                code: defaultCode,
                name: 'main',
                appId: app.id,
                description: `Entry point for ${app.name}`,
              }),
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
          scripts: { where: { childHash: null } },
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
        include: { scripts: { where: { childHash: null } }, scriptMain: true },
      });

      const fork = await prisma.app.create({
        data: {
          name: app.name,
          description: app.description,
        },
        select: defaultSelect,
      });

      app.scripts.map(async (script, i) => {
        const forkScript = await prisma.script.create({
          data: {
            ...script,
            inputSchema: JSON.stringify(script.inputSchema),
            outputSchema: JSON.stringify(script.outputSchema),
            hash: await createScriptHash({ ...script, appId: fork.id }),
            parentHash: script.hash,
            appId: fork.id,
            order: i,
          },
        });

        if (script.hash === app.scriptMain?.scriptHash) {
          await prisma.scriptMain.create({
            data: {
              app: { connect: { id: fork.id } },
              script: { connect: { hash: forkScript.hash } },
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
        scripts: z
          .array(
            z.object({
              originalHash: z.string(),
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

      const app = await prisma.app.update({
        where: { id },
        data: rest,
        select: defaultSelect,
      });

      if (scripts) {
        await Promise.all(
          scripts.map(async (script, i) => {
            const { originalHash, data } = script;
            const newHash = await createScriptHash({
              code: data.code,
              appId: id,
              name: data.name,
              description: data.description,
            });

            if (newHash !== originalHash) {
              const newScript = await prisma.script.create({
                data: {
                  ...data,
                  hash: newHash,
                  parentHash: originalHash,
                  filename: `${slugify(data.name)}.ts`,
                  appId: id,
                  order: i,
                },
              });

              await prisma.script.update({
                where: { hash: originalHash },
                data: { childHash: newHash },
              });

              if (originalHash === app.scriptMain?.scriptHash) {
                await prisma.scriptMain.update({
                  where: {
                    appId: app.id,
                  },
                  data: {
                    script: { connect: { hash: newScript.hash } },
                  },
                });
              }
            }
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
