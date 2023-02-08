/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import clerkClient from '@clerk/clerk-sdk-node';
import { Prisma, PrismaClient } from '@prisma/client';
import { ResourceOwnerType } from '@zipper/types';
import slugify from 'slugify';

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
      slug: 'zoom-meeting-notes',
      description:
        'Post meeting notes to Slack in multiple languages using Google Cloud Functions',
      isPrivate: false,
      submissionState: 2,
      scripts: {
        createMany: {
          data: [
            {
              id: mainScriptId,
              name: 'main',
              filename: 'main.ts',
              description: 'entry point for the app',
              code: `import { joinMeeting } from './join-the-current-meeting.ts';
              export default async function main() {
                if (joinMeeting()) {
                  return 'Joined the meeting';
                }
              }
              `,
              order: 0,
            },
            {
              id: otherScriptId,
              name: 'Join the current meeting',
              filename: 'join-the-current-meeting.ts',
              description:
                'Looks at a users meetings and joins the current or upcoming one',
              code: `export const joinMeeting = () => {
                console.log("Joining the meeting");
                return true;
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
    update: {},
  });

  const clerkUsers = await clerkClient.users.getUserList();
  const clerkOrgs = await clerkClient.organizations.getOrganizationList();

  const userSlugData: Prisma.ResourceOwnerSlugCreateInput[] = clerkUsers.map(
    (user) => ({
      resourceOwnerId: user.id,
      resourceOwnerType: ResourceOwnerType.User,
      slug:
        (user.publicMetadata.username as string) ||
        user.username ||
        `${user.firstName}-${user.lastName}-${Math.floor(Math.random() * 100)}`,
    }),
  );

  const orgSlugData: Prisma.ResourceOwnerSlugCreateInput[] = clerkOrgs.map(
    (org) => ({
      resourceOwnerId: org.id,
      resourceOwnerType: ResourceOwnerType.Organization,
      slug: slugify(org.name, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
      }),
    }),
  );

  await prisma.resourceOwnerSlug.createMany({
    data: [...userSlugData, ...orgSlugData],
    skipDuplicates: true,
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
