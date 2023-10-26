import { prisma } from '~/server/prisma';
import { createUploadthing, type FileRouter } from 'uploadthing/next-legacy';
import { createNextPageApiHandler } from 'uploadthing/next-legacy';
import { getServerSession } from 'next-auth';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await getServerSession();

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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

const handler = createNextPageApiHandler({
  router: ourFileRouter,
});

export default handler;
