import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { getScriptHash } from '~/utils/hashing';
import isCodeRunnable from '~/utils/is-code-runnable';
import { slugifyAllowDot } from '~/utils/slugify';
import { hasAppEditPermission } from '../utils/authz.utils';
import { kebabCase } from '~/utils/kebab-case';
import { createTRPCRouter, publicProcedure } from '../root';
import { RunnableExtensionSchema } from '~/utils/file-extension';
import { getFileExtension } from '@zipper/utils';

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
        filename: z
          .string()
          .min(1)
          .max(255)
          .transform((filename) => {
            const extension = getFileExtension(filename);
            if (!extension)
              throw new Error(`Extension from ${filename} isnt allowed`);

            const name = filename.replace(/\..+$/, '');

            return {
              full: `${kebabCase(name)}.${extension}`,
              extension,
              name,
            };
          }),
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
            'postgres',
            'mysql',
            'mongodb',
            'discord',
            'notion',
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, filename, ...data } = input;
      await hasAppEditPermission({ ctx, appId });

      const isRunnableExtension = RunnableExtensionSchema.safeParse(
        filename.extension,
      ).success;

      const code = (() => {
        if (isRunnableExtension) {
          return data.code;
        }
        if (filename.extension === 'md') {
          return DEFAULT_MD;
        }
        if (filename.extension === 'json') {
          return '{}';
        }
        if (filename.extension === 'ts' || filename.extension === 'tsx') {
          return DEFAULT_CODE;
        }
        return '';
      })();

      const script = await prisma.script.create({
        data: {
          ...data,
          code,
          name: filename.name,
          filename: filename.full,
          isRunnable: isRunnableExtension ? isCodeRunnable(data.code) : false,
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
          filename: z.string().min(1).max(255).optional(),
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

      const filename = data.filename
        ? `${slugifyAllowDot(data.filename)}`
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

      if (newFilename.length <= 0) return false;

      await hasAppEditPermission({
        ctx,
        appId,
      });

      const scripts = await prisma.script.findMany({
        where: {
          appId,
          filename: {
            startsWith: `${newFilename}.%`,
          },
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
