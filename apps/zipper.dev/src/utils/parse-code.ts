import { InputParam, InputType, ParsedNode } from '@zipper/types';
import { parse as commentParse } from 'comment-parser';
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
  Type,
  TypeReferenceNode,
  TypeLiteralNode,
} from 'ts-morph';
import { rewriteSpecifier } from './rewrite-imports';
import { getRemoteModule } from './eszip-utils';

// const buildCache = new BuildCachxe();

type ParseProject = {
  handlerFile: string;
  modules: Record<string, string>;
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

// Strip the Deno-style file extension since TS-Morph can't handle it
function removeTsExtension(moduleName: string) {
  if (moduleName.slice(-3).toLowerCase() === '.ts')
    return moduleName.slice(0, -3);
  return moduleName;
}

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
    // we have a type reference
    const typeReference = typeNode.getTypeName();
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

function createProject(modules: Record<string, string>) {
  const project = new Project({
    useInMemoryFileSystem: true,
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
      return {
        resolveModuleNames: (moduleNames, containingFile) => {
          const compilerOptions = getCompilerOptions();
          const resolvedModules: ts.ResolvedModule[] = [];

          for (const moduleName of moduleNames) {
            const localModuleName = removeTsExtension(moduleName);
            const result = ts.resolveModuleName(
              localModuleName,
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

  for (const [filename, code] of Object.entries(modules)) {
    project.createSourceFile(filename, code);
  }

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

function solveTypeReference(
  typeNode: TypeReferenceNode,
  fileName: string,
  project: Project | undefined,
): TypeNode | undefined {
  const src = project?.getSourceFile(fileName);
  if (!src || !project) return;

  const typeReferenceName = typeNode.getTypeName().getText();
  const declaration =
    src.getTypeAlias(typeReferenceName) ||
    src.getInterface(typeReferenceName) ||
    src.getEnum(typeReferenceName);

  const isInSameFile = !!declaration;
  if (isInSameFile && declaration) {
    console.log('found in the SAME file');
    if (declaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
      const node = declaration.getTypeNode();
      return node;
    }
    if (declaration.isKind(SyntaxKind.InterfaceDeclaration)) {
      // TODO
    }
    if (declaration.isKind(SyntaxKind.EnumDeclaration)) {
      // TODO
    }
  } else {
    const imports = src.getImportDeclarations();
    const importDeclaration = imports.find((x) => {
      const insideImport = x.getNamedImports().map((n) => n.getText());
      return insideImport.includes(typeReferenceName);
    });

    if (!importDeclaration) {
      console.error(
        'Couldnt find whats being imported in any import import declaration',
      );
      return;
    }

    const fileInProject = importDeclaration.getModuleSpecifierSourceFile();

    // External import
    if (!fileInProject) {
      console.log(
        'external import',
        importDeclaration.getModuleSpecifierValue(),
      );
      // // solve external import
      // const specifier = importDeclaration.getModuleSpecifierValue();
      // // fetch external import
      // const externalModule = await getRemoteModule({
      //   specifier: rewriteSpecifier(specifier),
      // });

      // if (!externalModule) {
      //   console.error('Couldnt fetch external module');
      //   return;
      // }
      // // add in the project
      // const externalModuleSourceFile = project.createSourceFile(
      //   specifier,
      //   externalModule.content,
      // );
      // // get the type node in the file
      // const declaration =
      //   externalModuleSourceFile.getTypeAlias(typeReferenceName) ||
      //   externalModuleSourceFile.getInterface(typeReferenceName) ||
      //   externalModuleSourceFile.getEnum(typeReferenceName);

      // const isInSameFile = !!declaration;
      // if (isInSameFile && declaration) {
      //   console.log('found in the REMOTE file');

      //   if (declaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
      //     const node = declaration.getTypeNode();
      //     console.log('imported type node', node?.getFullText());
      //     return node;
      //   }
      //   if (declaration.isKind(SyntaxKind.InterfaceDeclaration)) {
      //     // TODO
      //   }
      //   if (declaration.isKind(SyntaxKind.EnumDeclaration)) {
      //     // TODO
      //   }
      // }
      return;
    }

    // Import from another file in the project
    const declaration =
      fileInProject.getTypeAlias(typeReferenceName) ||
      fileInProject.getInterface(typeReferenceName) ||
      fileInProject.getEnum(typeReferenceName);

    const isInSameFile = !!declaration;
    if (isInSameFile && declaration) {
      console.log('found in OTHER file');

      if (declaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
        const node = declaration.getTypeNode();
        console.log('imported type node', node?.getFullText());
        return node;
      }
      if (declaration.isKind(SyntaxKind.InterfaceDeclaration)) {
        // TODO
      }
      if (declaration.isKind(SyntaxKind.EnumDeclaration)) {
        // TODO
      }
    }
  }
}

function parseHandlerInputs(
  handlerFn: HandlerFn,
  handlerFile: string,
  project: Project | undefined,
  throwErrors: boolean,
): InputParam[] {
  const inputs = handlerFn.getParameters();
  const params = inputs[0];

  const src = project?.getSourceFile(handlerFile);

  if (!params || params.getText().startsWith('_') || !src) {
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
        node: { type: InputType.any },
        optional: params.hasQuestionToken(),
      },
    ];
  }

  if (
    typeNode?.isKind(SyntaxKind.TypeReference) &&
    !src.getTypeAlias(typeNode?.getText())?.getTypeNode()
  ) {
    console.log('type reference', typeNode.getText());
    const node = solveTypeReference(typeNode, handlerFile, project);
    if (!node) return [];
    if (node.isKind(SyntaxKind.TypeLiteral)) {
      return unwrapObject(node);
    }
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
  // TODO: If there's no (input : Type) annotation, we get the type from the function
  // TODO: (input: Parameters<typeof someFunction>) or (input: Pick<SomeType, 'foo' | 'bar'>)

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

function unwrapObject(node: TypeLiteralNode): InputParam[] {
  const props = node.getProperties();

  return props.map((prop) => {
    const isOptional = prop.hasQuestionToken();
    const typeNode = prop.getTypeNode();
    if (!typeNode) {
      return {
        key: prop.getName(),
        node: { type: InputType.any },
        optional: isOptional,
      };
    }

    const typeDetails = parseTypeNode(typeNode, node.getSourceFile());

    const result = {
      key: prop.getName(),
      optional: isOptional,
      node: typeDetails,
    };
    return result;
  });
}

// returns undefined if the file isn't runnable (no handler function)
export function parseInputForTypes({
  handlerFile,
  project,
  throwErrors = false,
}: ParseCode): undefined | InputParam[] {
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

export function parseActions({
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
          inputs: parseHandlerInputs(
            handlerFn,
            handlerFile,
            project,
            throwErrors,
          ),
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

function getSourceWithoutComments(handlerFile: string, project?: Project) {
  const src = project?.getSourceFile(handlerFile);
  // TODO: !!!
  // stripComments(
  //     typeof srcPassedIn === 'string' ? srcPassedIn : srcPassedIn.getText(),
  //   ),
  return src;
}

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
  const src = getSourceWithoutComments(handlerFile, project);

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

export const isClientModule = (inputs: ParseCode) =>
  parseDirectivePrologue(inputs) === USE_CLIENT_DIRECTIVE;

export function parseApp({ handlerFile, modules, throwErrors }: ParseProject) {
  const project = createProject(modules);
  return parseCode({ handlerFile, project, throwErrors });
}

function parseCode({ handlerFile, project, throwErrors = false }: ParseCode) {
  let inputs = parseInputForTypes({ handlerFile, project, throwErrors });

  const actions = parseActions({ handlerFile, throwErrors, project });

  const externalImportUrls = parseExternalImportUrls({
    handlerFile,
    project,
  });

  const imports = parseImports({ handlerFile, project });

  const comments = parseComments({ handlerFile, project });
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
  const project = new Project({
    useInMemoryFileSystem: true,
  });
  const handlerFile = 'handler.ts';
  const src = project.createSourceFile(handlerFile, code);
  return { project, src, handlerFile };
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

  const existingParams = parseInputForTypes({ handlerFile, project });
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
