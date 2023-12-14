import { createNextPageApiHandler } from 'uploadthing/next-legacy';
import { ourFileRouter } from '@zipper/utils';

const handler = createNextPageApiHandler({
  router: ourFileRouter,
});

export default handler;
