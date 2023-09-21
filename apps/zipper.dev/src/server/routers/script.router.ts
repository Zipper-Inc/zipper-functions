import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { getScriptHash } from '~/utils/hashing';
import isCodeRunnable from '~/utils/is-code-runnable';
import { slugifyAllowDot } from '~/utils/slugify';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';
import { kebabCase } from '~/utils/kebab-case';

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

export const DEFAULT_CODE = `export async function handler({ world }: { world: string }) {
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

export const scriptRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      name: z.string().min(1).max(255).transform(kebabCase),
      description: z.string().optional(),
      appId: z.string().uuid(),
      code: z.string().default(DEFAULT_CODE),
      order: z.number(),
      connectorId: z
        .enum(['github', 'slack', 'openai', 'zendesk', 'github-app'])
        .optional(),
    }),
    async resolve({ ctx, input }) {
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
    },
  })
  .query('byAppId', {
    input: z.object({
      appId: z.string().uuid(),
    }),
    async resolve({ input }) {
      return prisma.script.findMany({
        where: {
          appId: input.appId,
        },
        orderBy: { order: 'asc' },
        select: defaultSelect,
      });
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      return prisma.script.findFirstOrThrow({
        where: {
          id: input.id,
        },
        select: defaultSelect,
      });
    },
  })
  // edit
  .mutation('edit', {
    input: z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
      }),
    }),
    async resolve({ ctx, input }) {
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
    },
  })
  .query('validateFilename', {
    input: z.object({
      appId: z.string().uuid(),
      newFilename: z.string(),
    }),
    async resolve({ ctx, input }) {
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
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string().uuid(),
      appId: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
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
    },
  });
