import { InputParams, InputType, JSONEditorInputTypes } from '@zipper/types';
import { getFieldName, parseFieldName } from './form';
import { safeJSONParse } from './safe-json';

export const getInputsFromFormData = (
  formData: Record<string, any>,
  inputParams: InputParams,
) => {
  const formKeys = inputParams.map(({ key, type }) => getFieldName(key, type));
  return Object.keys(formData)
    .filter((k) => formKeys.includes(k))
    .reduce((acc, cur) => {
      const { name, type } = parseFieldName(cur);

      let value = JSONEditorInputTypes.includes(type as InputType)
        ? safeJSONParse(
            formData[cur],
            undefined,
            type === InputType.array ? [] : {},
          )
        : formData[cur];

      if (type === InputType.boolean) {
        value = !!value;
      }

      return { ...acc, [name]: value.toString() };
    }, {} as Record<string, any>);
};
