import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { HttpStatusCode as Status } from '@zipper/types';
import { safeJSONParse } from '@zipper/utils';
import { Context } from '../context';
import { verifyHmac } from '~/utils/verify-hmac';
import {
  internalServerError,
  methodNeedsBody,
  simpleErrorResponse,
  SuccessResponse,
  ErrorResponse,
  successResponse,
  errorResponse,
  methodNotAllowed,
  unauthorizedError,
  ApiError,
} from './api.utils';

type OmniHandler<R extends NextApiResponse = SuccessResponse | ErrorResponse> =
  (
    req: NextApiRequest & { body: Zipper.Serializable },
    res: NextApiResponse,
  ) => Promise<R>;

export const OMNI_USER_ID = '__OMNI__';

/** Wraps an omni handler with auth and stuff */
export const createOmniApiHandler =
  (handler: OmniHandler): NextApiHandler =>
  async (req, res) => {
    try {
      const hmac = req.headers['x-zipper-hmac'] as string;
      if (
        process.env.NODE_ENV !== 'development' &&
        (!hmac ||
          !process.env.HMAC_SIGNING_SECRET ||
          !verifyHmac(req, process.env.HMAC_SIGNING_SECRET))
      ) {
        return unauthorizedError({ res });
      }

      // Assert existance of body if trying to make an update
      if (methodNeedsBody(req.method) && !req.body) {
        return simpleErrorResponse({
          res,
          status: Status.BAD_REQUEST,
          message: 'Missing body',
        });
      }

      req.body = req.body && safeJSONParse(req.body, undefined, req.body);
      return await handler(req, res);
    } catch (e) {
      return internalServerError({ req, res, e });
    }
  };

export const getOmniContext = (req: NextApiRequest): Context => ({
  userId: OMNI_USER_ID,
  orgId: undefined,
  organizations: undefined,
  req,
  session: undefined,
});

export {
  internalServerError,
  methodNeedsBody,
  simpleErrorResponse,
  unauthorizedError,
  successResponse,
  errorResponse,
  methodNotAllowed,
};

export type { SuccessResponse, ErrorResponse, ApiError as OmniApiError };
