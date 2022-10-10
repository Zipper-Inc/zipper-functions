/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = '5c03994c-fc16-47e0-bd02-d218a370a078';

  await prisma.app.upsert({
    where: {
      id,
    },
    create: {
      id,
      name: 'Post meeting notes to Slack in multiple languages',
      description:
        'Post meeting notes to Slack in multiple languages using Google Cloud Functions',
      code: "import joinMeeting from './joinMeeting';",
      scripts: {
        create: {
          name: 'Join the current meeting',
          filename: 'join-meeting.js',
          description:
            'Looks at a users meetings and joins the current or upcoming one',
          code: 'module.exports = { console.log("Hello world"); }',
          hash: '1234567890',
        },
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
