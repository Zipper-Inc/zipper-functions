import { Handlers } from '$fresh/server.ts';

export const handler: Handlers<any> = {
  GET(_req, ctx) {
    return ctx.renderNotFound();
  },
};

export default null;
