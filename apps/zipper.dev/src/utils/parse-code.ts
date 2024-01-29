import { InputParam, InputType, ParsedNode } from '@zipper/types';
import { parse as commentParse } from 'comment-parser';

import stripComments from 'strip-comments';
import {
  ParameterDeclaration,
  Project,
  SyntaxKind,
  ts,
  SourceFile,
  FunctionDeclaration,
  ArrowFunction,
  EnumMember,
  TypeNode,
  CallExpression,
  FunctionExpression,
  Type,
  TypeReferenceNode,
  TypeLiteralNode,
  Node,
} from 'ts-morph';
import { rewriteSpecifier } from './rewrite-imports';

type ParseProject = {
  handlerFile: string;
  project?: Project;
  modules?: Record<string, string>;
  throwErrors?: boolean;
};

type ParseCode = {
  handlerFile: string;
  project?: Project;
  throwErrors?: boolean;
};

export const isExternalImport = (specifier: string) =>
  /^https?:\/\//.test(specifier);
export const endsWithTs = (specifier: string) => /\.(ts|tsx)$/.test(specifier);

const ZIPPER_DEPENDENCIES = '/zipper_dependencies';

/**
 * This function adds the external module to the project, creating a folder structure like this:
 * @param specifier The specifier of the external module
 * @param code The code of the external module
 * @param project The project where the external module will be added
 * @example With the specifier
 * ```
 * https://zipper.dev/zipper-inc/slack-install-link/src/main.ts
 * - /zipper_dependencies
 *    |- zipper-inc
 *      |- slack-install-link
 *         |- main.ts
 *         |- types.ts
 * ```
 */
const addExternalInProject = (
  specifier: string,
  code: string,
  project: Project,
) => {
  const { hostname: packageOrigin, pathname } = new URL(specifier);
  const parts = pathname.split('/');
  const filename = parts.pop();
  if (!filename) return;

  const folders = parts.slice(0, -1);

  let dir = project.createDirectory(`${ZIPPER_DEPENDENCIES}/${packageOrigin}`);
  for (const folder of folders) {
    dir = dir.createDirectory(folder);
  }
  dir.createSourceFile(filename, code);
};

const isPrimitive = (type: Type) =>
  type.getText().toLowerCase() === 'zipper.fileurl' ||
  type.getText().toLowerCase() === 'date' ||
  type.isBoolean() ||
  type.isBooleanLiteral() ||
  type.isNumber() ||
  type.isNumberLiteral() ||
  type.isString() ||
  type.isStringLiteral() ||
  type.isUnknown() ||
  type.isAny() ||
  type.isObject() ||
  type.isReadonlyArray() ||
  type.isUnion();

function parsePrimitiveType(type: Type, node: TypeNode): ParsedNode {
  if (!isPrimitive(type)) return parseTypeNode(node, node.getSourceFile());

  // Zipper types
  if (type.getText().toLowerCase() === 'zipper.fileurl')
    return { type: InputType.file };
  if (type.getText().toLowerCase() === 'date') return { type: InputType.date };

  // Typescript default types
  if (type.isBoolean()) return { type: InputType.boolean };
  if (type.isBooleanLiteral())
    return {
      type: InputType.boolean,
      details: { literal: type.getText() === 'true' ? true : false },
    };
  if (type.isNumber()) return { type: InputType.number };
  if (type.isNumberLiteral())
    return {
      type: InputType.number,
      details: { literal: Number(type.getLiteralValue()) },
    };
  if (type.isString()) return { type: InputType.string };
  if (type.isStringLiteral())
    return {
      type: InputType.string,
      details: { literal: String(type.getLiteralValue()) },
    };
  if (type.isUnknown()) return { type: InputType.unknown };
  if (type.isAny()) return { type: InputType.any };
  if (type.isUnion())
    return {
      type: InputType.union,
      details: {
        values: type.getUnionTypes().map((t) => parsePrimitiveType(t, node)),
      },
    };

  // Array<string>, { name: string, age: number }[]
  if (type.isArray() || type.isReadonlyArray()) {
    const insideArray = type.getArrayElementType();
    if (insideArray?.isUnion()) {
      const unionValues = insideArray
        .getUnionTypes()
        .map((t) => parsePrimitiveType(t, node));
      return {
        type: InputType.array,
        details: {
          isUnion: true,
          values: unionValues,
        },
      };
    }

    return {
      type: InputType.array,
      details: {
        isUnion: false,
        values: insideArray
          ? parsePrimitiveType(insideArray, node)
          : { type: InputType.unknown },
      },
    };
  }

  if (type.isObject()) {
    // TODO: handle object types
  }

  return { type: InputType.unknown };
}

// Determine the Zipper type from the Typescript type
function parseTypeNode(typeNode: TypeNode, src: SourceFile): ParsedNode {
  // Lets add priority for Zipper defined types, since they can overlap with other types
  const type = typeNode.getType();
  if (isPrimitive(type)) return parsePrimitiveType(type, typeNode);

  if (typeNode.isKind(SyntaxKind.ParenthesizedType)) {
    return (
      typeNode.forEachChild((n) => parseTypeNode(n as TypeNode, src)) || {
        type: InputType.unknown,
      }
    );
  }

  // Parses a union type: Foo | Bar
  if (typeNode.isKind(SyntaxKind.UnionType)) {
    return {
      type: InputType.union,
      details: {
        values: typeNode
          .getType()
          .getUnionTypes()
          .map((t) => parsePrimitiveType(t, typeNode)),
      },
    };
  }

  // Parses an object like: { foo: string, bar: string }
  if (typeNode.isKind(SyntaxKind.TypeLiteral)) {
    const typeLiteralProperties = typeNode.getProperties();

    const properties = typeLiteralProperties.map((prop) => {
      const propTypeNode = prop.getTypeNode();
      const details: ParsedNode = propTypeNode
        ? parseTypeNode(propTypeNode, src)
        : {
            type: InputType.unknown,
          };
      return {
        key: prop.getName(),
        details,
      };
    });
    return {
      type: InputType.object,
      details: { properties },
    };
  }

  if (typeNode.isKind(SyntaxKind.ArrayType) || type.isReadonlyArray()) {
    const insideArray = type.getArrayElementType();

    // If the array is a union, we need to parse the union types
    if (insideArray?.isUnion()) {
      const unionValues = insideArray
        .getUnionTypes()
        .map((t) => parsePrimitiveType(t, typeNode));
      return {
        type: InputType.array,
        details: {
          isUnion: true,
          values: unionValues,
        },
      };
    }

    return {
      type: InputType.array,
      details: {
        isUnion: false,
        values: insideArray
          ? parsePrimitiveType(insideArray, typeNode)
          : { type: InputType.unknown },
      },
    };
  }

  // Solves the case of a type reference, like: type Foo = { foo: string, bar: string } in { input : Foo }
  if (typeNode.isKind(SyntaxKind.TypeReference)) {
    // find in the code the declaration of the typeReferenceText, this can be a type, a interface, a enum, etc.
    const declaration = getDeclarationUsingCompiler(typeNode);

    //we have the declaration, we need to know if it's a type, interface or enum
    if (declaration) {
      if (declaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
        // we have a type
        const typeReferenceDeclarationType = declaration.getTypeNode();

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
      if (declaration.isKind(SyntaxKind.InterfaceDeclaration)) {
        // we have a interface
        const typeReferenceDeclarationProperties = declaration.getProperties();
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
      if (declaration.isKind(SyntaxKind.EnumDeclaration)) {
        // we have a enum
        return {
          type: InputType.enum,
          details: {
            values: declaration.getMembers().map((member: EnumMember) => {
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
  if (typeNode.isKind(SyntaxKind.TypeOperator)) {
    const typeText = typeNode.getText();
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

export function createProject(initialModules?: Record<string, string>) {
  const project = new Project({
    useInMemoryFileSystem: true,
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
      return {
        resolveModuleNames: (moduleNames, containingFile) => {
          const compilerOptions = getCompilerOptions();
          const resolvedModules: (ts.ResolvedModule | undefined)[] = [];

          for (const rawModuleName of moduleNames) {
            let rewrittenModuleName;
            const rewritten = rewriteSpecifier(rawModuleName);

            if (isExternalImport(rewritten)) {
              const url = new URL(rewritten);
              const { hostname: packageOrigin, pathname } = url;
              // TODO: The 'src' filter is a hack, since the specifier contains 'src' in the path, but the /x/bundle endpoint doesn't return it
              // issue [2](https://github.com/Zipper-Inc/zipper-functions/pull/744#issue-2105526771)
              const parts = pathname.split('/').filter((p) => p !== 'src');
              rewrittenModuleName = `${ZIPPER_DEPENDENCIES}/${packageOrigin}${parts.join(
                '/',
              )}`;
              console.log(
                '[project] rewritten external module name',
                rawModuleName,
                '->',
                rewrittenModuleName,
              );
            } else {
              rewrittenModuleName = rawModuleName;
            }

            const result = ts.resolveModuleName(
              rewrittenModuleName,
              containingFile,
              compilerOptions,
              moduleResolutionHost,
            );
            if (result.resolvedModule)
              resolvedModules.push(result.resolvedModule);
            else resolvedModules.push(undefined);
          }

          console.log(
            '[project] resolved modules in',
            containingFile,
            resolvedModules,
            project
              .getSourceFiles()
              .map((f) => ({ filename: f.getFilePath(), code: f.getText() })),
          );
          return resolvedModules;
        },
      };
    },
  });

  if (!initialModules) return project;

  for (const [filename, code] of Object.entries(initialModules)) {
    project.createSourceFile(filename, code, { overwrite: true });
  }
  project.createDirectory(ZIPPER_DEPENDENCIES);
  return project;
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
}): HandlerFn | undefined {
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

const getDeclarationUsingCompiler = (typeReference: TypeReferenceNode) => {
  try {
    const identifier = typeReference.getTypeName();
    if ('getLeft' in identifier) return;
    const nodes = identifier.getDefinitionNodes();
    return nodes[0];
  } catch {
    return;
  }
};

const getTypeNodeFromDeclaration = (definition: Node) => {
  // Ideally, we want to call parseType(declaration.getType()) here
  if (definition.isKind(SyntaxKind.TypeAliasDeclaration)) {
    const node = definition.getTypeNode();
    return node;
  }
  if (definition.isKind(SyntaxKind.InterfaceDeclaration)) {
    console.log('interface', definition.getText());
    // TODO
  }
  if (definition.isKind(SyntaxKind.EnumDeclaration)) {
    console.log('enum', definition.getText());
    // TODO
  }
};

async function solveTypeReference({
  typeReference,
  filename,
  project,
  shouldFetch = true,
}: {
  typeReference: TypeReferenceNode;
  filename: string;
  project: Project;
  shouldFetch?: boolean;
}) {
  const src = project?.getSourceFile(filename);
  const target = typeReference.getTypeName().getText();

  if (!src || !project) return;

  const localDefinition = getDeclarationUsingCompiler(typeReference);

  if (localDefinition && !localDefinition.isKind(SyntaxKind.ImportSpecifier))
    return getTypeNodeFromDeclaration(localDefinition);

  if (!shouldFetch || !localDefinition) return;

  const imports = src.getImportDeclarations();
  const importDeclaration = imports.find((x) => {
    const insideImport = x.getNamedImports().map((n) => n.getText());
    return insideImport.includes(target);
  });

  if (!importDeclaration) {
    console.error(
      'Couldnt find whats being imported in any import import declaration',
    );
    return;
  }

  const specifier = importDeclaration.getModuleSpecifierValue();
  // TODO: get the external module without using the bundle endpoint
  // since this is client side only
  const externalModule = await fetch(`/api/editor/ts/bundle?x=${specifier}`)
    .then((res) => res.json() as Promise<{ [filename: string]: string }>)
    .catch(() => null);

  if (!externalModule) {
    console.error('Couldnt fetch external module');
    return;
  }

  console.log('[project]', 'external fetch', externalModule);
  // TODO: Possible issue: the specifier from the `externalModule` here can be different from the one in the import declaration
  // due to the rewriteSpecifier rules or even the version in the resolved external module url. issue [2](https://github.com/Zipper-Inc/zipper-functions/pull/744#issue-2105526771)
  for (const [rawFilename, code] of Object.entries(externalModule)) {
    if (isExternalImport(rawFilename)) {
      addExternalInProject(rawFilename, code, project);
    }
  }

  return solveTypeReference({
    typeReference,
    filename,
    project,
    shouldFetch: false,
  });
}

async function parseHandlerInputs(
  handlerFn: HandlerFn,
  handlerFile: string,
  project: Project | undefined,
  throwErrors: boolean,
) {
  const inputs = handlerFn.getParameters();
  const params = inputs[0];

  const src = project?.getSourceFile(handlerFile);

  if (!params || params.getText().startsWith('_') || !src || !project) {
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

  // TODO: If there's no (input : Type) annotation, we should get the type from the function
  if (!typeNode || typeNode?.isKind(SyntaxKind.AnyKeyword)) {
    return [
      {
        key: params.getName(),
        node: { type: InputType.any },
        optional: params.hasQuestionToken(),
      },
    ];
  }

  if (typeNode.isKind(SyntaxKind.TypeReference)) {
    const node = await solveTypeReference({
      typeReference: typeNode,
      filename: handlerFile,
      project,
    }).catch(() => null);

    if (node?.isKind(SyntaxKind.TypeLiteral)) {
      return unwrapObject(node);
    }
    return [];
  }

  // TODO: (input: Parameters<typeof someFunction>) or (input: Pick<SomeType, 'foo' | 'bar'>)

  if (typeNode?.isKind(SyntaxKind.TypeLiteral)) {
    const props = typeNode.getProperties();
    return props.map((prop) => {
      const isOptional =
        prop.hasQuestionToken() || !!paramsWithDefaultValue?.[prop.getName()];
      const typeNode = prop.getTypeNode();
      if (!typeNode) {
        // Typescript defaults to any if it can't find the type
        // type Input = { foo } // foo is any
        return {
          key: prop.getName(),
          node: { type: InputType.any },
          optional: isOptional,
        };
      }

      const typeDetails = parseTypeNode(typeNode, src);

      const result = {
        key: prop.getName(),
        optional: isOptional,
        node: typeDetails,
      };
      return result;
    });
  }
  return [];
}

function unwrapObject(node: TypeLiteralNode): InputParam[] {
  const props = node.getProperties();

  return props.map((prop) => {
    const isOptional = prop.hasQuestionToken();
    const typeNode = prop.getTypeNode();
    if (!typeNode) {
      return {
        key: prop.getName(),
        node: { type: InputType.any } satisfies ParsedNode,
        optional: isOptional,
      };
    }
    try {
      const typeDetails = parseTypeNode(typeNode, typeNode.getSourceFile());
      return {
        key: prop.getName(),
        optional: isOptional,
        node: typeDetails,
      };
    } catch (e) {
      return {
        key: prop.getName(),
        node: { type: InputType.unknown } satisfies ParsedNode,
        optional: isOptional,
      };
    }
  });
}

// returns undefined if the file isn't runnable (no handler function)
export async function parseInputForTypes({
  handlerFile,
  project,
  throwErrors = false,
}: ParseCode) {
  try {
    const src = project?.getSourceFile(handlerFile);
    if (!src) return;

    const rootHandlerNode =
      src.getFunction('handler') || src.getVariableDeclaration('handler');

    // All good, this is a lib file!
    if (!rootHandlerNode) return;

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

    return parseHandlerInputs(handlerFn, handlerFile, project, throwErrors);
  } catch (e) {
    if (throwErrors) throw e;
    console.error('caught during parseInputForTypes', e);
  }
  return [];
}

// TODO: parseAction could accept all parsed inputs already, so we don't have to parse them again
export async function parseActions({
  handlerFile,
  project,
  throwErrors = false,
}: ParseCode) {
  const src = project?.getSourceFile(handlerFile);
  if (!src) return;

  try {
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

    // TODO: fix actions :D
    // const actions = actionsProperties.reduce((actionsSoFar, property) => {
    //   const name = property
    //     .getFirstChildIfKind(SyntaxKind.Identifier)
    //     ?.getText();

    //   const handlerFn =
    //     property.getLastChildIfKind(SyntaxKind.ArrowFunction) ||
    //     property.getLastChildIfKind(SyntaxKind.FunctionExpression) ||
    //     property.getLastChildIfKind(SyntaxKind.FunctionDeclaration);

    //   if (!name || !handlerFn) return actionsSoFar;

    //   return {
    //     ...actionsSoFar,
    //     [name]: {
    //       name,
    //       inputs: parseHandlerInputs(
    //         handlerFn,
    //         handlerFile,
    //         project,
    //         throwErrors,
    //       ),
    //     },
    //   };
    // }, {} as Record<string, { name: string; inputs: InputParam[] }>);
    // return Object.keys(actions).length ? actions : undefined;
    return undefined;
  } catch (e) {
    if (throwErrors) throw e;
    console.error('caught during parseActions', e);
  }
}

export function parseExternalImportUrls({
  handlerFile,
  project,
  externalOnly = true,
}: ParseCode & {
  externalOnly?: boolean;
}): string[] {
  const src = project?.getSourceFile(handlerFile);
  if (!src) return [];
  return src
    .getImportDeclarations()
    .map((i) => i.getModuleSpecifierValue())
    .filter((s) => (externalOnly ? isExternalImport(s) : true));
}

export function parseImports({ handlerFile, project }: ParseCode) {
  const src = project?.getSourceFile(handlerFile);
  if (!src) return [];
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

/**
 * The "directive prologue" is the first line of a file that starts with "use ___"
 * This is a special comment that tells the compiler to do something special
 * @example
 * "use client";
 */
export function parseDirectivePrologue({
  handlerFile,
  project,
  throwErrors = false,
}: ParseCode) {
  const src = project?.getSourceFile(handlerFile);
  if (!project || !src) return;
  const srcWithoutComments = project.createSourceFile(
    `zipper__without_comments_${handlerFile}`,
    stripComments(src.getText()),
  );

  const syntaxList = src?.getChildAtIndexIfKind(0, SyntaxKind.SyntaxList);

  const rootNode = syntaxList || src;

  const maybeDirective = rootNode
    ?.getChildAtIndexIfKind(0, SyntaxKind.ExpressionStatement)
    ?.getChildAtIndexIfKind(0, SyntaxKind.StringLiteral)
    ?.getLiteralText();

  project.removeSourceFile(srcWithoutComments);

  return maybeDirective && USE_DIRECTIVE_REGEX.test(maybeDirective)
    ? maybeDirective
    : undefined;
}

export const isClientModule = (inputs: ParseCode) =>
  parseDirectivePrologue(inputs) === USE_CLIENT_DIRECTIVE;

export function parseApp({
  handlerFile,
  project,
  modules,
  throwErrors,
}: ParseProject) {
  project = project || createProject();
  if (modules) {
    for (const [filename, code] of Object.entries(modules)) {
      project.createSourceFile(filename, code, { overwrite: true });
    }
  }
  return parseCode({ handlerFile, project, throwErrors });
}

async function parseCode({
  handlerFile,
  project,
  throwErrors = false,
}: ParseCode) {
  let inputs = await parseInputForTypes({
    handlerFile,
    project,
    throwErrors,
  });

  const actions = await parseActions({ handlerFile, throwErrors, project });

  const externalImportUrls = parseExternalImportUrls({
    handlerFile,
    project,
  });

  const imports = parseImports({ handlerFile, project });

  const comments = parseComments({ handlerFile, project });
  if (comments && inputs) {
    inputs = inputs.map((i) => {
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

  const directivePrologue = parseDirectivePrologue({
    handlerFile,
    project,
    throwErrors,
  });

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
  };
}

export function createProjectFromCode(code: string) {
  const project = createProject();
  const handlerFile = 'handler.ts';
  const src = project.createSourceFile(handlerFile, code);
  return { project, src, handlerFile };
}

export async function addParamToCode({
  code,
  paramName = 'newInput',
  paramType = 'string',
}: {
  code: string;
  paramName?: string;
  paramType?: string;
}): Promise<string> {
  const { src, handlerFile, project } = createProjectFromCode(code);

  const handler = src?.getFunction('handler');
  const handlerComment = handler
    ?.getFullText()
    .split('\n')
    .reduce<string[]>((acc, curr) => {
      if (curr.trim().startsWith('/**') || curr.trim().startsWith('*')) {
        return [...acc, curr.trim()];
      } else if (curr.trim().startsWith('export async function handler')) {
        return acc; // Stop processing comments after reaching the function definition
      } else {
        return acc;
      }
    }, [])
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

  const existingParams = await parseInputForTypes({ handlerFile, project });
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

export function getTutorialJsDocs({
  code,
  jsdoc,
}: {
  code: string;
  jsdoc: string;
}) {
  const { src } = createProjectFromCode(code);
  const jsDocText = jsdoc.replace(/\s+/g, ' ').trim();

  const foundVariable = src.getVariableStatements().find((variable) => {
    const variableJSDoc = variable
      .getJsDocs()[0]
      ?.getFullText()
      .replace(/\s+/g, ' ')
      .trim();

    return variableJSDoc === jsDocText;
  });

  const foundFn = src.getFunctions().find((fn) => {
    const fnText = fn.getJsDocs()[0]?.getFullText().replace(/\s+/g, ' ').trim();

    return fnText === jsDocText;
  });

  if (foundVariable) {
    return {
      startLine: foundVariable?.getStartLineNumber(),
      endLine: foundVariable?.getEndLineNumber(),
    };
  }

  if (foundFn) {
    return {
      startLine: foundFn?.getStartLineNumber(),
      endLine: foundFn?.getEndLineNumber(),
    };
  }
}

export function parseComments({ handlerFile, project }: ParseCode) {
  const src = project?.getSourceFile(handlerFile);
  if (!src) return;

  const handlerFn = findHandlerFunction({ src });
  if (!handlerFn) return;

  const jsDocComments = handlerFn.getJsDocs();
  if (jsDocComments.length > 0) {
    return commentParse(jsDocComments.at(-1)?.getFullText() || '')[0];
  }

  return;
}

export const hasHandler = ({ code }: { code: string }) => {
  const { src } = createProjectFromCode(code);
  return !!findHandlerFunction({ src });
};

export function parseCodeSerializable(params: ParseCode) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ...rest } = parseCode(params);
  return {
    ...rest,
  };
}
