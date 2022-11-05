export function safeJSONParse(
  json: string,
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
