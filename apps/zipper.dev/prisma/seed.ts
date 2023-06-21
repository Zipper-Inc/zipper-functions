/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';
import { generateSlug } from 'random-word-slugs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const defaultOrgId = crypto.randomUUID();
  const readOnlyOrgId = crypto.randomUUID();
  const readOnlySlug = generateSlug(2, { format: 'kebab' }).toLowerCase();
  const mainScriptId = crypto.randomUUID();
  const mainScriptId2 = crypto.randomUUID();

  await prisma.organization.createMany({
    data: [
      {
        id: defaultOrgId,
        name: 'Zipper',
        slug: 'zipper',
      },
      {
        id: readOnlyOrgId,
        name: readOnlySlug,
        slug: readOnlySlug,
      },
    ],
  });

  await prisma.resourceOwnerSlug.createMany({
    data: [
      {
        slug: 'zipper',
        resourceOwnerId: defaultOrgId,
        resourceOwnerType: 0,
      },

      {
        slug: readOnlySlug,
        resourceOwnerId: readOnlyOrgId,
        resourceOwnerType: 0,
      },
    ],
  });

  await prisma.app.create({
    data: {
      slug: 'word-counter',
      description: 'Counts words in a text. This is a demo app for Zipper.',
      isPrivate: false,
      organizationId: defaultOrgId,
      submissionState: 3,
      scripts: {
        createMany: {
          data: [
            {
              id: mainScriptId,
              name: 'main',
              filename: 'main.ts',
              description: 'entry point for the app',
              code: `import { countWords } from './count-words.ts';

export async function handler({ text }: { text: string }) {
  return countWords(text);
}`,
              order: 0,
            },
            {
              name: 'count-words',
              filename: 'count-words.ts',
              code: `export const countWords = (text: string) => {
  console.log("Counting the words...");
  return text.split(" ").length;
};`,
              order: 1,
            },
          ],
        },
      },
      scriptMain: {
        create: { script: { connect: { id: mainScriptId } } },
      },
    },
  });

  await prisma.app.create({
    data: {
      slug: 'ai-word-counter',
      description: 'Counts words using AI.',
      isPrivate: false,
      organizationId: readOnlyOrgId,
      submissionState: 3,
      scripts: {
        createMany: {
          data: [
            {
              id: mainScriptId2,
              name: 'main',
              filename: 'main.ts',
              description: 'entry point for the app',
              code: `export async function handler({ text }: { text: string }) {
  return Math.floor(Math.random() * 100);
}`,
              order: 0,
            },
          ],
        },
      },
      scriptMain: {
        create: { script: { connect: { id: mainScriptId2 } } },
      },
    },
  });

  await prisma.allowListIdentifier.create({
    data: {
      value: 'zipper.works',
      defaultOrganizationId: defaultOrgId,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
