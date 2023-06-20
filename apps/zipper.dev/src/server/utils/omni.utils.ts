import { NextApiResponse } from 'next';
import { HttpStatusCode as Status } from '@zipper/types';

type BaseBody = { ok: boolean };
type SuccessBody = { ok: true; data: Zipper.Serializable };
type ApiError = {
  message: string;
  longMessage?: string;
  code?: string | number;
};
type ErrorBody = { ok: false; errors: ApiError[] };

type OmniResponder<B extends BaseBody = SuccessBody> = (
  res: NextApiResponse<B>,
) => (
  body: B & { __meta__?: Zipper.Serializable },
  options?: {
    status?: Http.StatusCode;
  },
) => NextApiResponse<B>;

const smartStringify = (obj: Zipper.Serializable) =>
  ['number', 'string', 'boolean'].includes(typeof obj)
    ? obj!.toString()
    : JSON.stringify(obj);

export const success: OmniResponder<SuccessBody> =
  (res: NextApiResponse) =>
  (body, { status = Status.OK } = {}) =>
    res.status(status).end(smartStringify(body));

export const error: OmniResponder<ErrorBody> =
  (res: NextApiResponse) =>
  (body, { status = Status.INTERNAL_SERVER_ERROR } = {}) =>
    res.status(status).end(smartStringify(body));
