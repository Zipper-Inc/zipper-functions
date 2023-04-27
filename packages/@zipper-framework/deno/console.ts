export function sendLog({
  appId,
  version,
  runId,
  log,
}: {
  appId: string;
  version: string;
  runId?: string;
  log: Zipper.Log.SortableMessage;
}) {
  const url = new URL(Deno.env.get('RPC_HOST') as string);
  url.pathname = `/api/app/${appId}/${version}/logs`;
  if (runId) url.pathname = `${url.pathname}/${runId}`;
  fetch(url, { method: 'POST', body: JSON.stringify(log) });
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
