import { generateComponents } from '@uploadthing/react';
import type { OurFileRouter } from '@zipper/utils';

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>({
    url: '/api/uploadthing',
  });
