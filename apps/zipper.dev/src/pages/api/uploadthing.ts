import { prisma } from '~/server/prisma';
import { createUploadthing } from 'uploadthing/next-legacy';
import { createNextPageApiHandler } from 'uploadthing/next-legacy';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { ourFileRouter } from '@zipper/utils';

const f = createUploadthing();

const zipperDevUploadRouter = {
  ...ourFileRouter,
  avatarUploader: f({ image: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, res }) => {
      // This code runs on your server before upload
      const session = await getServerSession(req, res, authOptions);

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new Error('Unauthorized');

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      if (!metadata.userId)
        throw new Error('Missing userId on UploadThing upload complete');
      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          image: file.url,
        },
      });
    }),
};

export type OurFileRouter = typeof zipperDevUploadRouter;

const handler = createNextPageApiHandler({
  router: zipperDevUploadRouter,
});

export default handler;
