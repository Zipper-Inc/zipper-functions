import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { HttpMethod as Method, HttpStatusCode as Status } from '@zipper/types';
import { safeJSONParse } from '@zipper/utils';
import { Context } from '../context';

import { verifyAccessToken } from '~/utils/jwt-utils';

type BaseBody = {
  ok: boolean;
  meta?: Record<string, Zipper.Serializable>;
};
export type ApiError = {
  message: string;
  longMessage?: string;
  code?: string | number;
};

type SuccessBody = BaseBody & { ok: true; data: Zipper.Serializable };
type ErrorBody = BaseBody & { ok: false; errors: ApiError[] };

type ApiResponder<B extends BaseBody = SuccessBody> = ({
  res,
  body,
  status,
}: {
  res: NextApiResponse<B>;
  body: B;
  status?: Status;
}) => NextApiResponse<B>;

export type SuccessResponse = NextApiResponse<SuccessBody>;
export type ErrorResponse = NextApiResponse<ErrorBody>;

type ApiHandler<R extends NextApiResponse = SuccessResponse | ErrorResponse> = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: Context,
) => Promise<R>;

const smartStringify = (obj: any) =>
  ['number', 'string', 'boolean'].includes(typeof obj)
    ? obj.toString()
    : JSON.stringify(obj);

/** Generic success handler for omni API calls */
export const successResponse: ApiResponder<SuccessBody> = ({
  res,
  status = Status.OK,
  body,
}) =>
  res
    .setHeader('Content-Type', 'application/json')
    .status(status)
    .end(smartStringify(body));

/** Generic error handler for omni API calls */
export const errorResponse: ApiResponder<ErrorBody> = ({
  res,
  status = Status.INTERNAL_SERVER_ERROR,
  body,
}) =>
  res
    .setHeader('Content-Type', 'application/json')
    .status(status)
    .end(smartStringify(body));

export const simpleErrorResponse = ({
  res,
  status = Status.INTERNAL_SERVER_ERROR,
  message = 'Internal server error',
}: {
  res: NextApiResponse;
  status: Status;
  message: string;
}) =>
  errorResponse({
    res,
    status,
    body: {
      ok: false,
      errors: [{ message, code: status }],
    },
  });

/** Error when using an unsupported HTTP method */
export const methodNotAllowed = ({
  method = 'method',
  res,
}: {
  method?: string;
  res: ErrorResponse;
}) =>
  errorResponse({
    res,
    status: Status.METHOD_NOT_ALLOWED,
    body: {
      ok: false,
      errors: [
        {
          message: `Cannot use ${method}`,
          code: Status.METHOD_NOT_ALLOWED,
        },
      ],
    },
  });

/** Generic catch all error */
export const internalServerError = ({
  req,
  res,
  e: caughtError = 'Unknown internal server error',
}: {
  req: NextApiRequest;
  res: ErrorResponse;
  e: unknown;
}) =>
  errorResponse({
    res,
    status: Status.INTERNAL_SERVER_ERROR,
    body: {
      ok: false,
      errors: [
        {
          message: caughtError?.toString?.() || JSON.stringify(caughtError),
          code: Status.INTERNAL_SERVER_ERROR,
        },
      ],
      meta: {
        request: {
          url: req.url,
          method: req.method,
          body: req.body,
        },
      },
    },
  });

export const methodNeedsBody = (method: unknown) =>
  [Method.PATCH, Method.POST, Method.PUT].includes(method as Method);

export const unauthorizedError = ({ res }: { res: NextApiResponse }) =>
  simpleErrorResponse({
    res,
    status: Status.UNAUTHORIZED,
    message: 'Unauthorized',
  });

/** Wraps an omni handler with auth and stuff */
export const createApiHandler =
  (handler: ApiHandler): NextApiHandler =>
  async (req, res) => {
    try {
      const authHeader = req.headers['authorization'] as string;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return await handler(req, res, {
          userId: undefined,
          orgId: undefined,
          organizations: undefined,
          req,
          session: undefined,
        });
      }

      const payload = verifyAccessToken(token);

      // Assert existance of body if trying to make an update
      if (methodNeedsBody(req.method) && !req.body) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing body',
        });
      }

      req.body = req.body && safeJSONParse(req.body, undefined, req.body);
      return await handler(req, res, {
        userId: payload.sub,
        orgId: undefined,
        organizations: payload.organizations,
        req,
        session: undefined,
      });
    } catch (e) {
      return internalServerError({ req, res, e });
    }
  };
