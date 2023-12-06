import { initApplet, AppletOptions } from '@zipper-inc/client-js';

export const initLocalApplet = (slug: string, options?: AppletOptions) =>
  initApplet(
    slug,
    process.env.NODE_ENV === 'development'
      ? {
          ...options,
          overrideZipperRun: `http://${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`,
        }
      : options,
  );
