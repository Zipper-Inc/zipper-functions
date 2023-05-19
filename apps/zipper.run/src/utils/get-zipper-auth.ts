import { getCookie } from 'cookies-next';
import { IncomingMessage } from 'http';
import { jwtVerify } from 'jose';

export const getZipperAuth = async (
  request: IncomingMessage & {
    cookies: Partial<{
      [key: string]: string;
    }>;
  },
) => {
  const zipperAccessToken = getCookie('__zipper_token', { req: request }) as
    | string
    | undefined;

  if (zipperAccessToken) {
    const { payload } = await jwtVerify(
      zipperAccessToken,
      new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!),
    );

    return { userId: payload.sub, token: zipperAccessToken };
  }

  return { userId: undefined, token: undefined };
};
