import { withParser, ObjectExpression } from 'jscodeshift';

export const updateConnectorConfig = (
  code: string,
  configObjectName: string,
  newConfig: Record<string, any>,
) => {
  const $j = withParser('tsx')(code);

  return $j
    .findVariableDeclarators(configObjectName)
    .find(ObjectExpression)
    .replaceWith(JSON.stringify(newConfig, null, 2))
    .toSource();
};
