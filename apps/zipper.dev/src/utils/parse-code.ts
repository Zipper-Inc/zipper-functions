import { InputParam, InputType, ParsedNode } from '@zipper/types';
import { parse } from 'comment-parser';
import stripComments from 'strip-comments';
import {
  ParameterDeclaration,
  Project,
  PropertySignature,
  SyntaxKind,
  ts,
  SourceFile,
  FunctionDeclaration,
  ArrowFunction,
  EnumMember,
  TypeNode,
  CallExpression,
  FunctionExpression,
} from 'ts-morph';

type ParseCodeParameters = {
  code?: string;
  throwErrors?: boolean;
  src?: SourceFile;
};

export const isExternalImport = (specifier: string) =>
  /^https?:\/\//.test(specifier);
export const endsWithTs = (specifier: string) => /\.(ts|tsx)$/.test(specifier);

// Strip the Deno-style file extension since TS-Morph can't handle it
function removeTsExtension(moduleName: string) {
  if (moduleName.slice(-3).toLowerCase() === '.ts')
    return moduleName.slice(0, -3);
  return moduleName;
}

// Determine the Zipper type from the Typescript type
function parseTypeNode(type: TypeNode, src: SourceFile): ParsedNode {
  const text = type.getText();
  if (text.toLowerCase() === 'boolean') return { type: InputType.boolean };
  if (text.toLowerCase() === 'number') return { type: InputType.number };
  if (text.toLowerCase() === 'string') return { type: InputType.string };
  if (text.toLowerCase() === 'date') return { type: InputType.date };
  if (text.toLowerCase() === 'unknown') return { type: InputType.unknown };
  if (text.toLowerCase() === 'any') return { type: InputType.any };
  if (text.toLowerCase() === 'zipper.fileurl') return { type: InputType.file };
  if (text.toLocaleLowerCase().match(/"\w+"(\s*\|\s*"\w+")*/g))
    return { type: InputType.string };
  if (text.toLocaleLowerCase().match(/\d+(\s*\|\s*\d+)*/g))
    return { type: InputType.number };

  if (type.isKind(SyntaxKind.ArrayType) || text.startsWith('Array'))
    return { type: InputType.array };

  if (type.isKind(SyntaxKind.TypeReference)) {
    // we have a type reference
    const typeReference = type.getTypeName();
    const typeReferenceText = typeReference.getText();

    // find in the code the declaration of the typeReferenceText, this can be a type, a interface, a enum, etc.
    const typeReferenceDeclaration =
      src.getTypeAlias(typeReferenceText) ||
      src.getInterface(typeReferenceText) ||
      src.getEnum(typeReferenceText);

    //we have the declaration, we need to know if it's a type, interface or enum
    if (typeReferenceDeclaration) {
      if (typeReferenceDeclaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
        // we have a type
        const typeReferenceDeclarationType =
          typeReferenceDeclaration.getTypeNode();

        // check if type is a string literal
        if (
          typeReferenceDeclarationType &&
          typeReferenceDeclarationType.isKind(SyntaxKind.UnionType)
        ) {
          const unionTypes = typeReferenceDeclarationType.getTypeNodes();
          const unionTypesDetails = unionTypes.map((unionType: TypeNode) => {
            return unionType.getText().replace(/['"]+/g, '').trim();
          });

          return {
            type: InputType.enum,
            details: {
              values: unionTypesDetails,
            },
          };
        }
        if (typeReferenceDeclarationType)
          return parseTypeNode(typeReferenceDeclarationType, src);
      }
      if (typeReferenceDeclaration.isKind(SyntaxKind.InterfaceDeclaration)) {
        // we have a interface
        const typeReferenceDeclarationProperties =
          typeReferenceDeclaration.getProperties();
        const propDetails = typeReferenceDeclarationProperties.map(
          (prop: any) => {
            return {
              key: prop.getName(),
              details: parseTypeNode(prop.getTypeNode(), src),
            };
          },
        );
        return {
          type: InputType.object,
          details: { properties: propDetails },
        };
      }
      if (typeReferenceDeclaration.isKind(SyntaxKind.EnumDeclaration)) {
        // we have a enum
        return {
          type: InputType.enum,
          details: {
            values: typeReferenceDeclaration
              .getMembers()
              .map((member: EnumMember) => {
                const memberText = member.getFullText().trim();

                // check if the memberText has a value by checking if it has a '='
                const hasValue = memberText.includes('=');
                if (!hasValue) {
                  return memberText.trim();
                }

                // if it has a value, we need to extract it
                const memberValue = memberText
                  .split('=')[1]
                  ?.replace(/['"]+/g, '')
                  .trim();
                return {
                  key: memberText.split('=')[0]?.trim(),
                  value: memberValue,
                };
              }),
          },
        };
      }
    }
  }

  // Handle keyof typeof Category type
  if (type.isKind(SyntaxKind.TypeOperator)) {
    const typeText = type.getText();
    const match = typeText.match(/keyof typeof (\w+)/);
    if (match && match[1]) {
      const enumName = match[1];
      const enumDeclaration = src.getEnum(enumName);
      if (enumDeclaration) {
        return {
          type: InputType.enum,
          details: {
            values: enumDeclaration
              .getMembers()
              .map((member: any) => member.getName()),
          },
        };
      }
    }
  }
  return { type: InputType.unknown };
}

export function getSourceFileFromCode(code = '', filename = 'main.ts') {
  const project = new Project({
    useInMemoryFileSystem: true,
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
      return {
        resolveModuleNames: (moduleNames, containingFile) => {
          const compilerOptions = getCompilerOptions();
          const resolvedModules: ts.ResolvedModule[] = [];

          for (const moduleName of moduleNames.map(removeTsExtension)) {
            const result = ts.resolveModuleName(
              moduleName,
              containingFile,
              compilerOptions,
              moduleResolutionHost,
            );
            if (result.resolvedModule)
              resolvedModules.push(result.resolvedModule);
          }

          return resolvedModules;
        },
      };
    },
  });

  return project.createSourceFile(filename, code);
}

type HandlerFn = FunctionDeclaration | ArrowFunction | FunctionExpression;
type HandlerNode = HandlerFn | CallExpression | undefined;

const HANDLER_KINDS = [
  SyntaxKind.FunctionDeclaration,
  SyntaxKind.ArrowFunction,
  SyntaxKind.FunctionExpression,
  SyntaxKind.VariableDeclaration,
  SyntaxKind.CallExpression,
];

function findHandlerFunction({
  src,
  name = 'handler',
  node = src?.getFunction(name) || src.getVariableDeclaration(name),
}: {
  src: SourceFile;
  name?: string;
  node?: any;
}): void | HandlerFn {
  if (!node) return;

  // ✅ function handler() {}
  if (node.isKind(SyntaxKind.FunctionDeclaration)) return node;

  // ✅ const handler = ???
  if (node.isKind(SyntaxKind.VariableDeclaration)) {
    const child = node.getFirstChild((c: HandlerFn) =>
      HANDLER_KINDS.includes(c.getKind()),
    );

    // covers the rest of the cases below starting with arrow functions
    if (child) return findHandlerFunction({ src, node: child });

    const identifier = node
      .getChildrenOfKind(SyntaxKind.Identifier)
      ?.pop()
      ?.getText();

    // ✅ const handler = anotherFunction
    if (identifier && identifier !== name) {
      return findHandlerFunction({ src, name: identifier });
    }
  }

  // ✅ const handler = () => {}
  if (node.isKind(SyntaxKind.ArrowFunction)) return node;

  // ✅ const handler = function() {}
  if (node.isKind(SyntaxKind.FunctionExpression)) return node;

  // ✅ const handler = withThing(???)
  if (node.isKind(SyntaxKind.CallExpression) && node.getArguments()?.[0]) {
    return findHandlerFunction({
      src,
      node: node.getArguments()[0],
    });
  }

  // ✅ const handler = withThing(anotherFunction)
  if (node.isKind(SyntaxKind.Identifier) && node.getText() !== name) {
    return findHandlerFunction({ src, name: node.getText() });
  }
}

function parseHandlerInputs(
  handlerFn: HandlerFn,
  src: SourceFile,
  throwErrors: boolean,
) {
  const inputs = handlerFn.getParameters();
  const params = inputs[0] as ParameterDeclaration;

  if (!params || params.getText().startsWith('_')) {
    return [];
  }

  const paramsWithDefaultValue = params
    .getFirstChildByKind(SyntaxKind.ObjectBindingPattern)
    ?.getElements()
    .reduce((acc, curr) => {
      const key = curr.getFirstChildByKind(SyntaxKind.Identifier)?.getText();
      const value = curr.getInitializer();
      if (key && value) {
        return { ...acc, [key]: value.getText() };
      }
      return acc;
    }, {} as Record<string, string>);
  const typeNode = params.getTypeNode();

  if (!typeNode || typeNode?.isKind(SyntaxKind.AnyKeyword)) {
    return [
      {
        key: params.getName(),
        type: InputType.any,
        optional: params.hasQuestionToken(),
      },
    ];
  }

  let props: PropertySignature[] = [];

  try {
    props = typeNode?.isKind(SyntaxKind.TypeLiteral)
      ? // A type literal, like `params: { foo: string, bar: string }`
        (typeNode as any)?.getProperties()
      : // A type reference, like `params: Params`
        // Finds the type alias by its name and grabs the node from there
        (
          src.getTypeAlias(typeNode?.getText() as string)?.getTypeNode() as any
        )?.getProperties();
  } catch (e) {
    if (throwErrors) {
      throw new Error('Cannot get the properties of the object parameter.');
    }
    return [];
  }

  if (!typeNode || !props) {
    console.error('No types, treating input as any');
  }

  return props.map((prop) => {
    const isOptional =
      prop.hasQuestionToken() || !!paramsWithDefaultValue?.[prop.getName()];
    const typeNode = prop.getTypeNode();
    if (!typeNode) {
      // Typescript defaults to any if it can't find the type
      // type Input = { foo } // foo is any
      return {
        key: prop.getName(),
        type: InputType.any,
        optional: isOptional,
      };
    }

    const typeDetails = parseTypeNode(typeNode, src);

    const result = {
      key: prop.getName(),
      type: typeDetails.type,
      optional: isOptional,
      ...('details' in typeDetails && { details: typeDetails.details }),
    };
    return result;
  });
}

// returns undefined if the file isn't runnable (no handler function)
export function parseInputForTypes({
  code = '',
  throwErrors = false,
  src: srcPassedIn,
}: ParseCodeParameters = {}): undefined | InputParam[] {
  if (!code) return undefined;

  try {
    const src = srcPassedIn || getSourceFileFromCode(code);

    const rootHandlerNode =
      src.getFunction('handler') || src.getVariableDeclaration('handler');

    // All good, this is a lib file!
    if (!rootHandlerNode) {
      return undefined;
    }

    const handlerFn = findHandlerFunction({ src, node: rootHandlerNode });

    // Something went wrong here, there's a handler but we can't find the inner function
    if (!handlerFn) {
      return undefined;
    }

    // Now make sure it gets exported and is not the default
    if (!rootHandlerNode.hasExportKeyword() && throwErrors) {
      throw new Error('The handler function must be exported.');
    }
    if (rootHandlerNode.hasDefaultKeyword() && throwErrors) {
      throw new Error('The handler function cannot be the default export.');
    }

    return parseHandlerInputs(handlerFn, src, throwErrors);
  } catch (e) {
    if (throwErrors) throw e;
    console.error('caught during parseInputForTypes', e);
  }
  return [];
}

export function parseActions({
  code = '',
  throwErrors = false,
  src: srcPassedIn,
}: ParseCodeParameters = {}) {
  if (!code || !srcPassedIn) return undefined;

  try {
    const src = srcPassedIn || getSourceFileFromCode(code);
    const actionsDeclaration = src.getVariableDeclaration('actions');
    if (!actionsDeclaration) return undefined;

    const actionsObject = actionsDeclaration.getInitializerIfKind(
      SyntaxKind.ObjectLiteralExpression,
    );

    if (!actionsObject) return undefined;

    // Now make sure it gets exported and is not the default
    if (!actionsDeclaration.hasExportKeyword() && throwErrors) {
      throw new Error('The actions object must be exported.');
    }
    if (actionsDeclaration.hasDefaultKeyword() && throwErrors) {
      throw new Error('The actions object cannot be the default export.');
    }

    const actionsProperties = actionsObject.getProperties();

    const actions = actionsProperties.reduce((actionsSoFar, property) => {
      const name = property
        .getFirstChildIfKind(SyntaxKind.Identifier)
        ?.getText();

      const handlerFn =
        property.getLastChildIfKind(SyntaxKind.ArrowFunction) ||
        property.getLastChildIfKind(SyntaxKind.FunctionExpression) ||
        property.getLastChildIfKind(SyntaxKind.FunctionDeclaration);

      if (!name || !handlerFn) return actionsSoFar;

      return {
        ...actionsSoFar,
        [name]: {
          name,
          inputs: parseHandlerInputs(handlerFn, src, throwErrors),
        },
      };
    }, {} as Record<string, { name: string; inputs: InputParam[] }>);

    return Object.keys(actions).length ? actions : undefined;
  } catch (e) {
    if (throwErrors) throw e;
    console.error('caught during parseActions', e);
  }
}

export function parseExternalImportUrls({
  code = '',
  srcPassedIn,
  externalOnly = true,
}: {
  code?: string;
  srcPassedIn?: SourceFile;
  externalOnly?: boolean;
} = {}): string[] {
  if (!code) return [];
  const src = srcPassedIn || getSourceFileFromCode(code);
  return src
    .getImportDeclarations()
    .map((i) => i.getModuleSpecifierValue())
    .filter((s) => (externalOnly ? isExternalImport(s) : true));
}

export function parseImports({
  code = '',
  src: srcPassedIn,
}: ParseCodeParameters = {}) {
  if (!code) return [];
  const src = srcPassedIn || getSourceFileFromCode(code);
  return src.getImportDeclarations().map((i) => {
    const startPos = i.getStart();
    const endPos = i.getEnd();
    const { column: startColumn, line: startLine } =
      src.getLineAndColumnAtPos(startPos);
    const { column: endColumn, line: endLine } =
      src.getLineAndColumnAtPos(endPos);
    return {
      specifier: i.getModuleSpecifierValue(),
      startLine,
      startColumn,
      startPos,
      endLine,
      endColumn,
      endPos,
    };
  });
}

export const USE_DIRECTIVE_REGEX = /^use\s/;
export const USE_CLIENT_DIRECTIVE = 'use client';

function getSourceWithoutComments(srcPassedIn: string | SourceFile = '') {
  return getSourceFileFromCode(
    stripComments(
      typeof srcPassedIn === 'string' ? srcPassedIn : srcPassedIn.getText(),
    ),
  );
}

/**
 * The "directive prologue" is the first line of a file that starts with "use ___"
 * This is a special comment that tells the compiler to do something special
 * @example
 * "use client";
 */
export function parseDirectivePrologue({
  code = '',
  throwErrors = false,
  src: srcPassedIn,
}: ParseCodeParameters = {}) {
  const src = getSourceWithoutComments(srcPassedIn || code);

  const syntaxList = src?.getChildAtIndexIfKind(0, SyntaxKind.SyntaxList);

  const rootNode = syntaxList || src;

  const maybeDirective = rootNode
    ?.getChildAtIndexIfKind(0, SyntaxKind.ExpressionStatement)
    ?.getChildAtIndexIfKind(0, SyntaxKind.StringLiteral)
    ?.getLiteralText();

  return maybeDirective && USE_DIRECTIVE_REGEX.test(maybeDirective)
    ? maybeDirective
    : undefined;
}

export const isClientModule = (inputs: ParseCodeParameters) =>
  parseDirectivePrologue(inputs) === USE_CLIENT_DIRECTIVE;

export function parseCode({
  code = '',
  throwErrors = false,
  src: srcPassedIn,
}: ParseCodeParameters = {}) {
  const src: SourceFile | undefined =
    srcPassedIn || (code ? getSourceFileFromCode(code) : undefined);
  let inputs = parseInputForTypes({ code, throwErrors, src });

  const actions = parseActions({ code, throwErrors, src });

  const externalImportUrls = parseExternalImportUrls({
    code,
    srcPassedIn: src,
  });

  const imports = parseImports({ code, src });

  const comments = parseComments({ code, src });
  if (comments) {
    inputs = inputs?.map((i) => {
      const matchingTag = comments.tags.find(
        (t) => t.tag === 'param' && t.name === i.key,
      );
      if (!matchingTag) return i;
      const [name, description] = matchingTag.description
        .split(':')
        .map((i) => i.trim());
      return { ...i, name, description };
    });
  }

  const directivePrologue = parseDirectivePrologue({ code, throwErrors, src });

  return {
    inputs,
    actions,
    externalImportUrls,
    comments,
    localImports: imports.filter(
      ({ specifier }) => !isExternalImport(specifier),
    ),
    imports,
    directivePrologue,
    src,
  };
}

export function addParamToCode({
  code,
  paramName = 'newInput',
  paramType = 'string',
}: {
  code: string;
  paramName?: string;
  paramType?: string;
}): string {
  const src = getSourceFileFromCode(code);
  const handler = src.getFunction('handler');
  const handlerComment = handler
    ?.getFullText()
    .split('\n')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    .reduce((acc, curr) => {
      if (curr.trim().startsWith('/**') || curr.trim().startsWith('*')) {
        return [...acc, curr.trim()];
      } else if (curr.trim().startsWith('export async function handler')) {
        return acc; // Stop processing comments after reaching the function definition
      } else {
        return acc;
      }
    }, [] as string[])
    .map((line) => (line.startsWith('*') ? ' ' + line : line));

  if (!handler) {
    console.error('You must define a handler function');
    return code;
  }

  const inputs = handler.getParameters();
  if (!inputs.length) {
    // Create a new input object with the desired parameter
    const newParamString = `{ ${paramName} } : { ${paramName}
      ${paramType ? `: ${paramType}` : ''}
    }`;

    handler.replaceWithText(
      handlerComment?.join('\n') +
        '\n' +
        handler.getText().replace(/\(\)/, `(${newParamString})`),
    );

    return src.getFullText();
  }

  if (inputs.length !== 1 && inputs.length > 0) {
    return code;
  }

  const params = inputs[0] as ParameterDeclaration;
  const typeNode = params.getTypeNode();

  if (!typeNode) {
    console.error('No types, treating input as any');
    return code;
  }

  const existingParams = parseInputForTypes({ code });
  if (!existingParams) return code;
  // If there is an existing parameter, use its name instead of the default paramName
  if (existingParams.length && existingParams[0]) {
    paramName = existingParams[0].key;
  }

  if (existingParams.some((param) => param.key === paramName)) {
    console.error('Parameter with the same name already exists');
    return code;
  }

  const insertPosition = typeNode.getEnd() - 1;

  // Check if there's a type literal
  if (typeNode.isKind(SyntaxKind.TypeLiteral)) {
    const newParamString = existingParams.length
      ? `, ${paramName}${paramType ? `: ${paramType}` : ''}`
      : `${paramName}${paramType ? `: ${paramType}` : ''}`;

    const newCode = [
      code.slice(0, insertPosition),
      newParamString,
      code.slice(insertPosition),
    ].join('');

    return newCode;
  }

  // If there's no type literal, create one
  const newParamString = `{ ${paramName}${paramType ? `: ${paramType}` : ''} }`;
  const newCode = code.replace(
    /(\{[\s\S]*\})\s*:/,
    (_, match) => `${match} : ${newParamString}`,
  );

  return newCode;
}

export function parseComments({ code, src: srcPassedIn }: ParseCodeParameters) {
  if (!code) return;

  const src = srcPassedIn || getSourceFileFromCode(code);
  const handlerFn = src.getFunction('handler');

  if (!handlerFn) return;

  const jsDocComments = handlerFn.getJsDocs();
  if (jsDocComments.length > 0) {
    return parse(jsDocComments.at(-1)?.getFullText() || '')[0];
  }

  return;
}

export function parseCodeSerializable(params: ParseCodeParameters) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { src: _ignore, ...rest } = parseCode(params);
  return {
    ...rest,
  };
}
