export function safeJSONParse<T extends any>(
  json = '',
  reviver?: (key: string, value: any) => any,
  fallback?: any,
  verbose = false,
): T {
  // Handle trying to parse JSON that's already an object
  if (typeof json === 'object') {
    return JSON.parse(JSON.stringify(json), reviver);
  }

  // Everything else
  let parsed;
  try {
    parsed = JSON.parse(json, reviver);
  } catch (e) {
    if (verbose) console.error('Not vaild JSON', json);
    parsed = fallback;
  }
  return parsed;
}

export function safeJSONStringify(
  value: any,
  replacer?: any,
  spacer?: any,
  fallback?: string,
  verbose = false,
) {
  let stringified;
  try {
    stringified = JSON.stringify(value, replacer, spacer);
  } catch (e) {
    if (verbose) console.error('Not a valid object', value);
    stringified = fallback;
  }
  return stringified;
}

export const prettyJSON: typeof safeJSONStringify = (
  value,
  replacer,
  spacer = 2,
  fallback,
) => safeJSONStringify(value, replacer, spacer, fallback);
