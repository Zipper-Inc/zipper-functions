import { InputType } from './input-type';

export type LiteralNode =
  | { type: InputType.boolean; details?: { literal: boolean } }
  | { type: InputType.number; details?: { literal: number } }
  | { type: InputType.string; details?: { literal: string } };

export type ParsedNode =
  | LiteralNode
  | { type: InputType.date }
  | {
      type: InputType.array;
      details?:
        | { isUnion: true; values: ParsedNode[] }
        | { isUnion: false; values: ParsedNode };
    }
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
