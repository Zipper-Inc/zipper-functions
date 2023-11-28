import { X_ZIPPER_ACCESS_TOKEN } from '@zipper/utils';
import { IncomingMessage } from 'http';
import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

type RequestLike =
  | NextRequest
  | (IncomingMessage & {
      cookies: Partial<{
        [key: string]: string;
      }>;
    });

export const getZipperAuth = async (request: RequestLike) => {
  const zipperAccessToken =
    typeof request.headers.get === 'function'
      ? request.headers.get(X_ZIPPER_ACCESS_TOKEN)
      : (request.headers as Record<string, string>)[X_ZIPPER_ACCESS_TOKEN];

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
