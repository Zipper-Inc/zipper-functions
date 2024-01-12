import {
  getFieldName,
  getSearchParams,
  parseFieldNamesOnObject,
  safeJSONParse,
  safeJSONStringify,
} from '@zipper/utils';
import { InputParam, InputType } from '@zipper/types';
import { ParsedUrlQuery } from 'querystring';

export function formatValueFromUrl(input: InputParam, value: string | null) {
  if (!value) return null;

  switch (input.node.type) {
    case InputType.boolean:
      return value === '0' || value === 'false' ? null : true;

    case InputType.number:
      return parseFloat(value);

    case InputType.array:
      if (Array.isArray(safeJSONParse(value))) return value;
      return JSON.stringify(value.split(','));

    case InputType.any:
      return safeJSONParse(value, undefined, {});

    default:
      return value;
  }
}

export function getInputValuesFromUrl({
  inputs,
  query = {},
  url,
}: {
  inputs: InputParam[];
  query?: ParsedUrlQuery;
  url?: string;
}) {
  const searchParams = getSearchParams(url);

  const defaultValues = inputs.reduce<
    Record<string, Zipper.Primitive | undefined>
  >((values, input) => {
    const name = getFieldName(input.key, input.node.type);
    const value = searchParams.get(input.key) || (query[input.key] as string);
    return value === null || typeof value === 'undefined'
      ? values
      : { ...values, [name]: formatValueFromUrl(input, value) };
  }, {});

  return defaultValues;
}

export function getDefaultInputValuesFromConfig(
  inputParams: InputParam[],
  config?: Zipper.HandlerConfig,
) {
  const defaultValues = inputParams.reduce<{
    [inputName: string]: Zipper.InputValue;
  }>((values, input) => {
    const name = getFieldName(input.key, input.node.type);
    const value = config?.inputs?.[input.key]?.defaultValue;
    return value === null || typeof value === 'undefined'
      ? values
      : { ...values, [name]: value };
  }, {});

  return defaultValues;
}

export function getRunValues({
  inputParams,
  url,
  query,
  config,
}: {
  inputParams: InputParam[];
  url?: string;
  query?: ParsedUrlQuery;
  config?: Zipper.HandlerConfig;
}) {
  const runValues: Zipper.Inputs =
    typeof config?.run === 'object' ? config.run : {};

  const defaultValues = parseFieldNamesOnObject(
    getDefaultInputValuesFromConfig(inputParams, config),
  );

  const urlValues = parseFieldNamesOnObject(
    getInputValuesFromUrl({ inputs: inputParams, url, query }),
  );

  return { ...defaultValues, ...runValues, ...urlValues };
}

export function getInputValuesFromAppRun(
  inputParams: InputParam[],
  appRunInputs: Record<string, string>,
) {
  const defaultValues = inputParams.reduce<
    Record<string, Zipper.Primitive | undefined>
  >((values, input) => {
    const name = getFieldName(input.key, input.node.type);
    let value = appRunInputs[input.key] || null;
    if (value !== null && typeof value !== 'string') {
      value = safeJSONStringify(value) || null;
    }
    const formatedValue = formatValueFromUrl(input, value);
    return { ...values, [name]: formatedValue };
  }, {});

  return defaultValues;
}
