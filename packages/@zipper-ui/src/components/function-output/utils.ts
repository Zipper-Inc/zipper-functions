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
export const isAction = (value: Zipper.Action) =>
  value?.$zipperType === 'Zipper.Action';

export const isRouter = (value: Zipper.Router.Route) =>
  value?.$zipperType === 'Zipper.Router';

export function parseResult(result: any): { type: OutputType; data: any } {
  const data = isString(result) ? safeJSONParse(result) : result;
  if (!data || isPrimitive(data))
    return {
      type: isHtml(result) ? OutputType.Html : OutputType.String,
      data: result.toString(),
    };

  let type = OutputType.Object;

  if (isAction(data)) {
    type = OutputType.Action;
  } else if (isRouter(data)) {
    type = OutputType.Router;
  } else if (Array.isArray(data)) {
    if (data.every(isPrimitive)) type = OutputType.Array;
    else if (data.every((item) => isAction(item)))
      type = OutputType.ActionArray;
    else type = OutputType.Collection;
  }

  return { type, data };
}
