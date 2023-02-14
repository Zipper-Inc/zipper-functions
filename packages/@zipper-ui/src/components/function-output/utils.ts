import { OutputType } from '@zipper/types';
import { safeJSONParse } from '@zipper/utils';

export const TYPE_PRIMITIVES = ['number', 'string', 'boolean'];
export const isPrimitive = (value: any) =>
  TYPE_PRIMITIVES.includes(typeof value);
export const isString = (value: any) => typeof value === 'string';
export const isHtml = (value: any) => {
  if (!isString(value)) return false;
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
};

export function parseResult(result: any): { type: OutputType; data: any } {
  const data = isString(result) ? safeJSONParse(result) : result;
  if (!data || isPrimitive(data))
    return {
      type: isHtml(result) ? OutputType.Html : OutputType.String,
      data: result,
    };

  let type = OutputType.Object;

  if (Array.isArray(data)) {
    if (data.every(isPrimitive)) type = OutputType.Array;
    else type = OutputType.Collection;
  }

  return { type, data };
}
