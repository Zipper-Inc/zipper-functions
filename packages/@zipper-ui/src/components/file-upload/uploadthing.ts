import { generateComponents } from '@uploadthing/react';

import type { OurFileRouter } from '../../../../../apps/zipper.dev/src/pages/api/uploadthing';

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>({
    url: '/api/uploadthing',
  });
