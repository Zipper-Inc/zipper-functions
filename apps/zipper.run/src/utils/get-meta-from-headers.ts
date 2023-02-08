import { safeJSONParse } from '@zipper/utils';

export function getMetaFromHeaders(rawHeaders?: Headers) {
  if (!rawHeaders)
    return {
      warning: 'MISSING_HEADERS',
    };

  const {
    server,
    'x-deno-execution-id': executionId,
    'x-deno-timing': timing,
    'x-zipper-app-run-input': input,
    'x-zipper-app-slug': appSlug,
    'x-zipper-req-url': url,
    'x-zipper-req-method': method,
    'x-zipper-deployment-id': deploymentId,
  } = Object.fromEntries(rawHeaders.entries());

  return {
    deploymentId,
    appSlug,
    input: safeJSONParse(input, undefined, input),
    request: { method, url, executionId, server, timing },
  };
}
