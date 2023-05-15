import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';

export default authMiddleware({
  afterAuth: async ({ userId }, request: NextRequest) => {
    const res = NextResponse.next();

    if (!userId && !request.cookies.get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)) {
      res.cookies.set(
        ZIPPER_TEMP_USER_ID_COOKIE_NAME,
        `temp__${crypto.randomUUID()}`,
      );
    }

    return res;
  },
});

// Stop Middleware running on static files
export const config = {
  matcher:
    '/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico|apple-touch-icon.png|.*?api/ts.*?).*)',
};
