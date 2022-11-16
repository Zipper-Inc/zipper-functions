// yolo
// deno-lint-ignore-file no-explicit-any

import { parse } from 'https://deno.land/x/swc@0.2.1/mod.ts';
import { Application, Context } from 'https://deno.land/x/oak/mod.ts';

const DEFAULT_PORT = 3000;

const app = new Application();

enum InputType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
  array = 'array',
  object = 'object',
  any = 'any',
}

interface InputParam {
  key: string;
  type: InputType;
  optional: boolean;
}

interface ParseInputResponse {
  ok: true;
  code: string;
  params: InputParam[];
}

interface ParseInputError {
  ok: false;
  code: string;
  error: any;
}

const ACCEPTABLE_PARAM_PATTERNS = ['Identifier', 'ObjectPattern'];

function parseTypeAnnotation(typeAnnotation: any = {}): string {
  const {
    type,
    kind,
    typeName,
    typeAnnotation: innerAnnotation,
  } = typeAnnotation;

  if (type === 'TsTypeAnnotation') return parseTypeAnnotation(innerAnnotation);
  if (type === 'TsKeywordType') return kind;
  if (type === 'TsArrayType') return 'array';
  if (type === 'TsTypeLiteral') return 'object';
  if (type === 'TsTypeReference' && typeName?.value === 'Record')
    return 'object';
  if (type === 'TsTypeReference' && typeName?.value === 'Date') return 'date';
  return 'any';
}

function respondWithError(ctx: Context, code: string, error: unknown) {
  const response: ParseInputError = { ok: false, code, error };
  ctx.response.body = JSON.stringify(response);
  ctx.response.status = 500;
}

function respondWithSuccess(ctx: Context, code: string, params = []) {
  const response: ParseInputResponse = { ok: true, code, params };
  ctx.response.body = JSON.stringify(response);
  ctx.response.status = 200;
}

app.use(async (ctx: Context) => {
  try {
    const result = ctx.request.body({ type: 'text' });
    const code = await result.value;

    if (!code) {
      return respondWithError(ctx, code, 'There is no code to parse');
    }

    const ast = parse(code, {
      target: 'es2019',
      syntax: 'typescript',
      comments: false,
    });

    // Make sure there's a `function main()`
    const mainFunction = ast.body.find((node) => {
      const functionDeclaration =
        node?.type === 'FunctionDeclaration' &&
        node.identifier.value === 'main';

      const arrowFunction =
        node?.type === 'VariableDeclaration' &&
        node.declarations[0].id.value === 'main' &&
        node.declarations[0].init?.type === 'ArrowFunctionExpression';

      return functionDeclaration || arrowFunction;
    });

    if (!mainFunction) {
      return respondWithError(ctx, code, 'You must define a main function');
    }

    let params: Record<string, any> = mainFunction.params;
    if (!params && mainFunction.declarations) {
      params = mainFunction.declarations[0].init.params;
    }

    // It's valid if there is no input at all, no worries YOLO
    if (!params.length) {
      return respondWithSuccess(ctx, code);
    }

    // But if there is an input, let's keep it to 1
    if (params.length > 1) {
      return respondWithError(
        ctx,
        code,
        'Your main function can only take one input parameter',
      );
    }

    // Now let's verify if looks like an object
    const inputParam = params[0];

    const typeAnnotation = inputParam.pat
      ? inputParam.pat.typeAnnotation
      : inputParam.typeAnnotation;
    const inputParamType = inputParam.pat
      ? inputParam.pat.type
      : inputParam.type;

    if (!ACCEPTABLE_PARAM_PATTERNS.includes(inputParamType)) {
      return respondWithError(
        ctx,
        code,
        'Your input parameter must be an object',
      );
    }

    // Now let's parse types
    const members = typeAnnotation?.typeAnnotation?.members || [];

    // If there are types, let's translate them to their simple versions
    if (typeAnnotation?.type === 'TsTypeAnnotation' && members.length) {
      const params = typeAnnotation.typeAnnotation.members
        .filter(({ type }: { type: string }) => type === 'TsPropertySignature')
        .map(
          ({
            key,
            optional,
            typeAnnotation,
          }: {
            key: Record<string, string>;
            optional: boolean;
            typeAnnotation: Record<string, string>;
          }) => {
            const type = parseTypeAnnotation(typeAnnotation.typeAnnotation);
            return { key: key.value, optional, type };
          },
        );
      return respondWithSuccess(ctx, code, params);
    } else if (
      (!typeAnnotation && inputParamType === 'Identifier') ||
      !members.length
    ) {
      // If there are no types, yolo, it's basically an "any"
      return respondWithSuccess(ctx, code);
    }
    // Who knows what went wrong, but something doesn't work
    return respondWithError(
      ctx,
      code,
      'Please check your input parameter and try again.',
    );
  } catch (error) {
    // Who knows what went wrong, but something doesn't work
    return respondWithError(
      ctx,
      '',
      'Please check your input parameter and try again.',
    );
  }
});

await app.listen({ port: parseInt(location.port, 10) || DEFAULT_PORT });
