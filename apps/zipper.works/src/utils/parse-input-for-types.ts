import { InputParam, InputType } from '@zipper/types';

import {
  ParameterDeclaration,
  Project,
  PropertySignature,
  SyntaxKind,
  ts,
} from 'ts-morph';

// Strip the Deno-style file extension since TS-Morph can't handle it
function removeTsExtension(moduleName: string) {
  if (moduleName.slice(-3).toLowerCase() === '.ts')
    return moduleName.slice(0, -3);
  return moduleName;
}

// Determine the Zipper type from the Typescript type
function parseTypeNode(type: any) {
  const text = type.getText();
  if (text.toLowerCase() === 'boolean') return InputType.boolean;
  if (text.toLowerCase() === 'number') return InputType.number;
  if (text.toLowerCase() === 'string') return InputType.string;
  if (text.toLowerCase() === 'date') return InputType.date;
  if (type.isKind(SyntaxKind.ArrayType) || text.startsWith('Array'))
    return InputType.array;
  if (type.isKind(SyntaxKind.TypeLiteral) || text.startsWith('Record'))
    return InputType.object;
  return InputType.any;
}

function getSourceFileFromCode(code: string) {
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

  return project.createSourceFile('main.ts', code);
}

export function parseInputForTypes(
  code = '',
  throwIfNoMain = false,
): InputParam[] {
  if (!code && !throwIfNoMain) return [];
  if (!code && throwIfNoMain) throw new Error('No main function');

  try {
    const src = getSourceFileFromCode(code);
    let mainFn = src.getFunction('main');
    if (!mainFn) mainFn = src.getFunction('handler');

    if (!mainFn) {
      if (throwIfNoMain) throw new Error('No main function');
      console.error('You must define a main function');
      return [];
    }

    const inputs = mainFn.getParameters();

    if (inputs.length !== 1 && inputs.length > 0) {
      console.error('You must have one and only one input object');
      return [];
    }
    const params = inputs[0] as ParameterDeclaration;
    const typeNode = params.getTypeNode();

    const props: PropertySignature[] = typeNode?.isKind(SyntaxKind.TypeLiteral)
      ? // A type literal, like `params: { foo: string, bar: string }`
        (typeNode as any)?.getProperties()
      : // A type reference, like `params: Params`
        // Finds the type alias by its name and grabs the node from there
        (
          src.getTypeAlias(typeNode?.getText() as string)?.getTypeNode() as any
        )?.getProperties();

    if (!typeNode || !props) {
      console.error('No types, treating input as any');
    }

    return props.map((prop) => {
      const typeNode = prop.getTypeNode();
      return {
        key: prop.getName(),
        type: parseTypeNode(typeNode),
        optional: prop.hasQuestionToken(),
      };
    });
  } catch (e) {
    if (throwIfNoMain) throw e;
    console.error('caught during parseInputForTypes', e);
  }
  return [];
}

export function addParamToCode(
  code: string,
  paramName: string,
  paramType: string,
): string {
  const src = getSourceFileFromCode(code);
  let mainFn = src.getFunction('main');
  if (!mainFn) mainFn = src.getFunction('handler');

  if (!mainFn) {
    console.error('You must define a main function');
    return code;
  }

  const inputs = mainFn.getParameters();
  if (!inputs.length) {
    // Create a new input object with the desired parameter
    const newParamString = `{ ${paramName} } : { ${paramName}${
      paramType ? `: ${paramType}` : ''
    } }`;

    mainFn.replaceWithText(
      mainFn.getText().replace(/\(\)/, `(${newParamString})`),
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

  // return code;

  const existingParams = parseInputForTypes(code);

  if (existingParams.some((param) => param.key === paramName)) {
    console.error('Parameter with the same name already exists');
    return code;
  }

  const insertPosition = typeNode.getEnd() - 1;
  const newParamString = `${paramName}${paramType ? `: ${paramType}` : ''}, `;
  const newCode = [
    code.slice(0, insertPosition),
    newParamString,
    code.slice(insertPosition),
  ].join('');

  return newCode;
}
