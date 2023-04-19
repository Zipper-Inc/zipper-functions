import {
  getFieldName,
  getSearchParams,
  safeJSONParse,
  safeJSONStringify,
} from '@zipper/utils';
import { InputParam, InputType } from '@zipper/types';
import { parseDate } from 'chrono-node';

export function formatValueFromUrl(input: InputParam, value: string | null) {
  if (!value) return null;

  switch (input.type) {
    case InputType.boolean:
      return value === '0' || value === 'false' ? null : true;

    case InputType.number:
      return parseFloat(value);

    case InputType.array:
      if (Array.isArray(safeJSONParse(value))) return value;
      return JSON.stringify(value.split(','));

    case InputType.date:
      return parseDate(value).toISOString().split('T')[0] || null;

    default:
      return value;
  }
}

export function getInputValuesFromUrl(inputs: InputParam[], url?: string) {
  const searchParams = getSearchParams(url);

  const defaultValues = inputs.reduce<
    Record<string, string | number | true | null>
  >((values, input) => {
    const name = getFieldName(input.key, input.type);
    const value = searchParams.get(input.key);
    return { ...values, [name]: formatValueFromUrl(input, value) };
  }, {});

  return defaultValues;
}

export function getInputValuesFromAppRun(
  inputs: InputParam[],
  appRunInputs: Record<string, string>,
) {
  const defaultValues = inputs.reduce<
    Record<string, string | number | true | null>
  >((values, input) => {
    const name = getFieldName(input.key, input.type);
    let value = appRunInputs[input.key] || null;
    if (value !== null && typeof value !== 'string') {
      value = safeJSONStringify(value) || null;
    }
    const formatedValue = formatValueFromUrl(input, value);
    return { ...values, [name]: formatedValue };
  }, {});

  return defaultValues;
}
