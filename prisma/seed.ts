/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const id = '5c03994c-fc16-47e0-bd02-d218a370a078';
  const hash = createHash('sha256').update('hello world').digest('hex');
  const mainHash = createHash('sha256').update('main hash').digest('hex');

  await prisma.app.upsert({
    where: {
      id,
    },
    create: {
      id,
      name: 'Post meeting notes to Slack in multiple languages',
      description:
        'Post meeting notes to Slack in multiple languages using Google Cloud Functions',
      scripts: {
        createMany: {
          data: [
            {
              name: 'main',
              filename: 'main.ts',
              description: 'entry point for the app',
              code: `import { joinMeeting } from './joinMeeting';`,
              hash: mainHash,
              order: 0,
            },
            {
              name: 'Join the current meeting',
              filename: 'join_the_current_meeting.ts',
              description:
                'Looks at a users meetings and joins the current or upcoming one',
              code: 'module.exports = { console.log("Hello world"); }',
              hash,
              order: 1,
            },
          ],
        },
      },
      scriptMain: {
        create: { script: { connect: { hash: mainHash } } },
      },
    },
    update: {},
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
