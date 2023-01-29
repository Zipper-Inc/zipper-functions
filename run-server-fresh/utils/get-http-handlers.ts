import { Handler, Handlers } from '$fresh/server.ts';

/**
 * Assigns the handler passed into to all common HTTP methods
 * @param handler
 */
export function getHttpHandlers(handler: Handler): Handlers {
  return {
    GET: handler,
    HEAD: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    OPTIONS: handler,
    PATCH: handler,
  };
}
