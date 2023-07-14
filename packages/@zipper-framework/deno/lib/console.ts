export function sendLog({
  appId,
  version,
  runId,
  log,
}: {
  appId: string;
  version: string;
  runId?: string;
  log: Zipper.Log.Message;
}) {
  const url = new URL(
    `https://${Deno.env.get('PUBLICLY_ACCESSIBLE_RPC_HOST')}`,
  );
  url.pathname = `/api/app/${appId}/${version}/logs`;
  if (runId) url.pathname = `${url.pathname}/${runId}`;
  let promise: unknown = fetch(url, {
    method: 'POST',
    body: JSON.stringify(log),
  });
  // Prevent deno from waiting on this promise
  promise = null;
  return promise;
}

/**
 * Deno doesn't support const enums
 * So we're just gonna copy the values from `Zipper.Log.Method`
 */
export const methods: Zipper.Log.Method[] = [
  'log',
  'debug',
  'info',
  'warn',
  'error',
  'table',
  'clear',
  'time',
  'timeEnd',
  'count',
  'assert',
];
