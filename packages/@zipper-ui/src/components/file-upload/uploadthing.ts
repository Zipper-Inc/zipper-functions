import { generateComponents } from '@uploadthing/react';
import { generateReactHelpers } from '@uploadthing/react/hooks';

import type { OurFileRouter } from '@zipper/utils';

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>({
    url: '/api/uploadthing',
  });

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
