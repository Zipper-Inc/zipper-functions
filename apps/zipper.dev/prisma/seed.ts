/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';
import { generateSlug } from 'random-word-slugs';
import crypto from 'crypto';
import { getAppHash } from '../src/utils/hashing';

const prisma = new PrismaClient();

async function main() {
  const readOnlySlug = generateSlug(2, { format: 'kebab' }).toLowerCase();
  const [
    defaultOrgId,
    readOnlyOrgId,
    mainScriptId,
    mainScriptId2,
    templateScriptId,
    templateScriptId2,
    templateScriptId3,
    zipperCodemodUserId,
  ] = [...Array(10)].map(() => crypto.randomUUID());

  await prisma.organization.createMany({
    data: [
      {
        id: defaultOrgId,
        name: 'Zipper',
        slug: 'zipper-inc',
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

  await prisma.user.create({
    data: {
      id: zipperCodemodUserId,
      email: 'codemods@zipper.works',
      slug: 'zipper-codemods',
      name: 'Zipper Codemods',
    },
  });

  const seedApp1 = await prisma.app.create({
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
    include: {
      scripts: true,
    },
  });

  const hash = getAppHash(seedApp1);

  await prisma.version.create({
    data: {
      appId: seedApp1.id,
      hash,
      isPublished: true,
    },
  });

  await prisma.app.update({
    where: { id: seedApp1.id },
    data: {
      playgroundVersionHash: hash,
      publishedVersionHash: hash,
    },
  });

  const seedApp2 = await prisma.app.create({
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
    include: {
      scripts: true,
    },
  });

  const hash2 = getAppHash(seedApp2);

  await prisma.version.create({
    data: {
      appId: seedApp2.id,
      hash: hash2,
      isPublished: true,
    },
  });

  await prisma.app.update({
    where: { id: seedApp2.id },
    data: {
      playgroundVersionHash: hash2,
      publishedVersionHash: hash2,
    },
  });

  const template = await prisma.app.create({
    data: {
      slug: 'crud-template',
      name: 'CRUD Template',
      description: '🗄️',
      isPrivate: false,
      isTemplate: true,
      organizationId: readOnlyOrgId,
      submissionState: 0,
      scripts: {
        createMany: {
          data: [
            {
              id: templateScriptId,
              name: 'main',
              filename: 'main.ts',
              code: `export async function handler({ text }: { text: string }) {
  return Math.floor(Math.random() * 100);
}`,
              order: 0,
            },

            {
              id: templateScriptId2,
              name: 'set',
              filename: 'set.ts',
              code: `export async function handler({ text }: { text: string }) {
  return Math.floor(Math.random() * 100);
}`,
              order: 0,
            },

            {
              id: templateScriptId3,
              name: 'get',
              filename: 'get.ts',
              code: `export async function handler({ text }: { text: string }) {
  return Math.floor(Math.random() * 100);
}`,
              order: 0,
            },
          ],
        },
      },
      scriptMain: {
        create: { script: { connect: { id: templateScriptId } } },
      },
    },
    include: {
      scripts: true,
    },
  });

  const templateHash = getAppHash(template);

  await prisma.version.create({
    data: {
      appId: template.id,
      hash: templateHash,
      isPublished: true,
    },
  });

  await prisma.app.update({
    where: { id: template.id },
    data: {
      playgroundVersionHash: templateHash,
      publishedVersionHash: templateHash,
    },
  });

  await prisma.allowListIdentifier.createMany({
    data: [
      {
        value: 'zipper.works',
        defaultOrganizationId: defaultOrgId,
      },
      { value: 'arielconti10@gmail.com', defaultOrganizationId: defaultOrgId },
    ],
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
