import { Project, SyntaxKind } from 'ts-morph';
import { safeJSONParse } from '@zipper/utils';

type SlackConfig = {
  clientId?: string;
  userScopes: string[];
  botScopes: string[];
};
/**
 * Retrieves the Slack configuration from the provided script code.
 * @param scriptCode The script code containing the Slack configuration.
 * @returns The Slack configuration object.
 */
export const getSlackConfig = (scriptCode: string) => {
  const project = new Project();
  const sourceFile = project.createSourceFile(
    'slack-connector.ts',
    scriptCode || '',
  );
  const slackConfigText = safeJSONParse<SlackConfig>(
    sourceFile
      .getVariableDeclaration('slackConnectorConfig')
      ?.getChildren()
      .find((child) => child.isKind(SyntaxKind.ObjectLiteralExpression))
      ?.getFullText() as any,
  );
  return slackConfigText;
};
