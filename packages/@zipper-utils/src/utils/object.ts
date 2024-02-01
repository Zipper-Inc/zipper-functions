import { InputParam, InputType, JSONEditorInputTypes } from '@zipper/types';
import { getFieldName, parseFieldName } from './form';
import { safeJSONParse } from './safe-json';

export const getInputsFromFormData = (
  formData: Record<string, any>,
  inputParams: Array<Pick<InputParam, 'key'> & Pick<InputParam, 'node'>>,
) => {
  const formKeys = inputParams.map(({ key, node }) =>
    getFieldName(key, node.type),
  );
  return Object.keys(formData)
    .filter((k) => {
      return formKeys.includes(k);
    })
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

      if (name.startsWith('{')) {
        return { ...acc, ...value };
      }

      return { ...acc, [name]: value };
    }, {} as Record<string, any>);
};
