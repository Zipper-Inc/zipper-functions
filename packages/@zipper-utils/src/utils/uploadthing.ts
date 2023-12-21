import { createUploadthing } from 'uploadthing/next-legacy';
import { createNextPageApiHandler } from 'uploadthing/next-legacy';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    .onUploadError(({ error }) => {
      console.log('error', error);
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
};

export type OurFileRouter = typeof ourFileRouter;

const handler = createNextPageApiHandler({
  router: ourFileRouter,
});

export default handler;
