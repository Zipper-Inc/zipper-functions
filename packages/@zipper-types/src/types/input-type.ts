export enum InputType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
  array = 'array',
  object = 'object',
  any = 'any',
  enum = 'enum',
  file = 'FileUrl',
  unknown = 'unknown',
  union = 'union',
}

export const JSONEditorInputTypes = [
  InputType.array,
  InputType.object,
  InputType.any,
  InputType.unknown,
];
