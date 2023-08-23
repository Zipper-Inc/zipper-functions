import { InputType } from '@zipper/types';

/**
 * `getFieldName` gets the field name used to access a specific field value of the form context
 * @param name input name
 * @param type input type
 * @returns
 */
export const getFieldName = (name: string, type: InputType) =>
  `${name.replaceAll(`"`, '')}:${type}`;

/**
 * `parseFieldName` parses a given form field name
 * @param fieldName form field name to parse
 */
export const parseFieldName = (fieldName: string) => {
  const [name, type] = fieldName.split(':') as [string, InputType];
  return {
    name,
    type,
  };
};

export const parseFieldNamesOnObject = (obj: {
  [fieldName: string]: Zipper.InputValue;
}) =>
  Object.entries(obj).reduce(
    (_obj, [fieldName, inputParam]) => ({
      ..._obj,
      [parseFieldName(fieldName).name]: inputParam,
    }),
    {},
  );
