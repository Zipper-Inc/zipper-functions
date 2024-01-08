import { InputType } from './input-type';

export type ParsedNode =
  | { type: InputType.boolean }
  | { type: InputType.number }
  | { type: InputType.string }
  | { type: InputType.date }
  | { type: InputType.array }
  | { type: InputType.any }
  | { type: InputType.file }
  | { type: InputType.unknown }
  | { type: InputType.union; details: { values: ParsedNode[] } }
  | {
      type: InputType.enum;
      details: {
        values: Array<
          | string // enum Foo { Bar, Baz }
          | {
              // enum Foo { Bar = 'bar', Baz = 'baz' }
              key: string | undefined;
              value: string | undefined;
            }
        >;
      };
    }
  | {
      type: InputType.object;
      details: {
        properties: {
          key: string;
          details: ParsedNode;
        }[];
      };
    };
