export function safeJSONParse(
  json = '',
  reviver?: (key: string, value: any) => any,
  fallback?: any,
): any {
  let parsed;
  try {
    parsed = JSON.parse(json, reviver);
  } catch (e) {
    console.error('Not vaild JSON', json);
    parsed = fallback;
  }
  return parsed;
}

export function safeJSONStringify(
  value: any,
  replacer?: any,
  spacer?: any,
  fallback?: string,
) {
  let stringified;
  try {
    stringified = JSON.stringify(value, replacer, spacer);
  } catch (e) {
    console.error('Not a valid object', value);
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
