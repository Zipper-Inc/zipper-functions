import { IncomingMessage } from 'http';
import { jwtVerify } from 'jose';

export const getZipperAuth = async (
  request: IncomingMessage & {
    cookies: Partial<{
      [key: string]: string;
    }>;
  },
) => {
  const zipperAccessToken = request.headers['x-zipper-access-token'];

  if (zipperAccessToken) {
    const { payload } = await jwtVerify(
      zipperAccessToken as string,
      new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!),
    );

    return {
      userId: payload.sub,
      token: zipperAccessToken ? (zipperAccessToken as string) : undefined,
    };
  }

  return { userId: undefined, token: undefined };
};

export const readJWT = (token: string) => {
  return JSON.parse(Buffer.from(token.split('.')[1]!, 'base64').toString());
};
