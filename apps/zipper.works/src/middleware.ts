import { getAuth, withClerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withClerkMiddleware((req: NextRequest) => {
  const res = NextResponse.next();
  const { userId } = getAuth(req);
  if (!req.cookies.get('__zipper_user_id')) {
    res.cookies.set(
      '__zipper_user_id',
      userId || `temp__${crypto.randomUUID()}`,
    );
  }

  return res;
});

// Stop Middleware running on static files
export const config = {
  matcher: '/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)',
};
