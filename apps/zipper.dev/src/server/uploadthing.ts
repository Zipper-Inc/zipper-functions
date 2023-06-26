import { getToken } from 'next-auth/jwt';
import { prisma } from './prisma';
import { createUploadthing, type FileRouter } from 'uploadthing/next-legacy';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, res }) => {
      // This code runs on your server before upload
      const user = await getToken({ req });

      // If you throw, the user will not be able to upload
      if (!user) throw new Error('Unauthorized');

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          image: file.url,
        },
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
