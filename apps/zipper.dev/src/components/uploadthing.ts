import { generateComponents } from '@uploadthing/react';

import type { OurFileRouter } from '~/pages/api/uploadthing';

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>();
