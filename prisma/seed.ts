/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = '5c03994c-fc16-47e0-bd02-d218a370a078';
  const mainScriptId = '1b39a70c-c37c-4167-9429-9d9196a710fd';
  const otherScriptId = '66b731b0-04e8-454c-8988-b2385d9d3a64';

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
              id: mainScriptId,
              name: 'main',
              filename: 'main.ts',
              description: 'entry point for the app',
              code: `import { joinMeeting } from './joinMeeting';`,
              order: 0,
            },
            {
              id: otherScriptId,
              name: 'Join the current meeting',
              filename: 'join-the-current-meeting.ts',
              description:
                'Looks at a users meetings and joins the current or upcoming one',
              code: 'module.exports = { console.log("Hello world"); }',
              order: 1,
            },
          ],
        },
      },
      scriptMain: {
        create: { script: { connect: { id: mainScriptId } } },
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
