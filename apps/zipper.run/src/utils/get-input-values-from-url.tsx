import { getSearchParams, safeJSONParse } from '@zipper/utils';
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
  const defaultValues: Record<string, string | number | true | null> = {};
  const searchParams = getSearchParams(url);

  inputs.forEach((input) => {
    const name = `${input.key}:${input.type}`;
    const value = searchParams.get(input.key);
    defaultValues[name] = formatValueFromUrl(input, value);
  });

  return defaultValues;
}

export function getInputValuesFromAppRun(
  inputs: InputParam[],
  appRunInputs: Record<string, string>,
) {
  const defaultValues: Record<string, string | number | true | null> = {};

  inputs.forEach((input) => {
    const name = `${input.key}:${input.type}`;
    const value = appRunInputs[input.key];
    defaultValues[name] = formatValueFromUrl(input, value || null);
  });

  return defaultValues;
}
