import { InputType, JSONEditorInputTypes } from '@zipper/types';
import { parseFieldName } from './form';
import { safeJSONParse } from './safe-json';

export const parseInputObject = (
  formData: Record<string, any>,
  formKeys: string[],
) => {
  return Object.keys(formData)
    .filter((k) => formKeys.includes(k))
    .reduce((acc, cur) => {
      const { name, type } = parseFieldName(cur);

      const value = JSONEditorInputTypes.includes(type as InputType)
        ? safeJSONParse(
            formData[cur],
            undefined,
            type === InputType.array ? [] : {},
          )
        : formData[cur];
      return { ...acc, [name]: value };
    }, {} as Record<string, any>);
};
