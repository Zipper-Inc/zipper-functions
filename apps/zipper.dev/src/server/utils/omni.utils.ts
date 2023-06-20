import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { HttpStatusCode as Status } from '@zipper/types';
import { safeJSONParse } from '@zipper/utils';
import { Context } from '../context';

type BaseBody = { ok: boolean; meta?: Record<string, Zipper.Serializable> };
export type OmniApiError = {
  message: string;
  longMessage?: string;
  code?: string | number;
};

type SuccessBody = BaseBody & { ok: true; data: Zipper.Serializable };
type ErrorBody = BaseBody & { ok: false; errors: OmniApiError[] };

type OmniResponder<B extends BaseBody = SuccessBody> = ({
  res,
  body,
  status,
}: {
  res: NextApiResponse<B>;
  body: B;
  status?: Status;
}) => NextApiResponse<B>;

type SuccessResponse = NextApiResponse<SuccessBody>;
type ErrorResponse = NextApiResponse<ErrorBody>;

type OmniHandler<R extends NextApiResponse = SuccessResponse | ErrorResponse> =
  (
    req: NextApiRequest & { body: Zipper.Serializable },
    res: NextApiResponse,
  ) => Promise<R>;

export const OMNI_USER_ID = '__OMNI__';

const smartStringify = (obj: Zipper.Serializable) =>
  ['number', 'string', 'boolean'].includes(typeof obj)
    ? obj!.toString()
    : JSON.stringify(obj);

/** Generic success handler for omni API calls */
export const successResponse: OmniResponder<SuccessBody> = ({
  res,
  status = Status.OK,
  body,
}) =>
  res
    .setHeader('Content-Type', 'application/json')
    .status(status)
    .end(smartStringify(body));

/** Generic error handler for omni API calls */
export const errorResponse: OmniResponder<ErrorBody> = ({
  res,
  status = Status.INTERNAL_SERVER_ERROR,
  body,
}) =>
  res
    .setHeader('Content-Type', 'application/json')
    .status(status)
    .end(smartStringify(body));

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

/** Wraps an omni handler with auth and stuff */
export const createOmniApiHandler =
  (handler: OmniHandler): NextApiHandler =>
  (req, res) => {
    try {
      req.body = req.body && safeJSONParse(req.body, undefined, req.body);
      return handler(req, res);
    } catch (e) {
      return internalServerError({ req, res, e });
    }
  };

export const getOmniContext = (req: NextApiRequest): Context => ({
  userId: OMNI_USER_ID,
  orgId: undefined,
  organizations: undefined,
  req,
});
