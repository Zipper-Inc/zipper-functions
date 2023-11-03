import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { getScriptHash } from '~/utils/hashing';
import isCodeRunnable from '~/utils/is-code-runnable';
import { slugifyAllowDot } from '~/utils/slugify';
import { hasAppEditPermission } from '../utils/authz.utils';
import { kebabCase } from '~/utils/kebab-case';
import { createTRPCRouter, publicProcedure } from '../root';

const defaultSelect = Prisma.validator<Prisma.ScriptSelect>()({
  id: true,
  name: true,
  filename: true,
  appId: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  connectorId: true,
});

const DEFAULT_CODE = `export async function handler({ world }: { world: string }) {
  return \`hello \${world}\`;
};
`;

export const DEFAULT_MD = `# New Markdown File

Welcome! This is a new Markdown file.

## Getting Started

Add some **Markdown**! Here are some ideas:

- Add a header \`# Title\`
- Create a list
  - Item 1
  - Item 2
- Embed an image ![alt text](image url)
- Add a [link](https://example.com)
- **Bold**, *italics*, \`code\`, and more!
`;

export const scriptRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).transform(kebabCase),
        description: z.string().optional(),
        appId: z.string().uuid(),
        code: z.string().default(DEFAULT_CODE),
        order: z.number(),
        connectorId: z
          .enum([
            'github',
            'slack',
            'openai',
            'zendesk',
            'github-app',
            'discord',
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, ...data } = input;
      await hasAppEditPermission({ ctx, appId });

      const extension = data.name.includes('.md') ? '.md' : '.ts';
      const slugifiedName = slugifyAllowDot(data.name.replace(/\..+$/, ''));
      const filename = `${slugifiedName}${extension}`;
      const code =
        extension === '.ts'
          ? data.code
          : extension === '.md'
          ? DEFAULT_MD
          : DEFAULT_CODE;

      const script = await prisma.script.create({
        data: {
          ...data,
          code,
          filename,
          isRunnable: extension === '.ts' ? isCodeRunnable(data.code) : false,
          app: {
            connect: { id: appId },
          },
        },
        select: defaultSelect,
      });

      const hash = getScriptHash(script);
      await prisma.script.update({
        where: {
          id: script.id,
        },
        data: {
          hash,
        },
      });

      if (input.connectorId) {
        await prisma.appConnector.create({
          data: {
            appId: input.appId,
            type: input.connectorId,
          },
        });
      }

      return script;
    }),
  byAppId: publicProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      return prisma.script.findMany({
        where: {
          appId: input.appId,
        },
        orderBy: { order: 'asc' },
        select: defaultSelect,
      });
    }),
  byId: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return prisma.script.findFirstOrThrow({
        where: {
          id: input.id,
        },
        select: defaultSelect,
      });
    }),
  edit: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional().nullable(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      const script = await prisma.script.findFirstOrThrow({
        where: { id },
        select: { appId: true, id: true, code: true, filename: true },
      });

      await hasAppEditPermission({
        ctx,
        appId: script.appId,
      });

      const filename = data.name
        ? `${slugifyAllowDot(data.name)}.ts`
        : undefined;
      const hash = filename
        ? getScriptHash({
            ...script,
            filename,
          })
        : undefined;

      return prisma.script.update({
        data: {
          ...data,
          filename,
          hash,
        },
        where: {
          id,
        },
        select: defaultSelect,
      });
    }),
  validateFilename: publicProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        newFilename: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { appId, newFilename } = input;

      if (newFilename.length < 4) return false;

      await hasAppEditPermission({
        ctx,
        appId,
      });

      const scripts = await prisma.script.findMany({
        where: {
          appId,
          filename: `${newFilename}.ts`,
        },
        select: {
          filename: true,
        },
      });

      return scripts.length === 0;
    }),
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        appId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      const script = await prisma.script.delete({
        where: {
          id: input.id,
        },
      });

      if (script.connectorId) {
        await prisma.appConnector.delete({
          where: {
            appId_type: {
              appId: input.appId,
              type: script.connectorId,
            },
          },
        });
      }

      return {
        id: input.id,
      };
    }),
});
