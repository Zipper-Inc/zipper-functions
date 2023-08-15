import { ConnectorType } from '@zipper/types';
import { GitHubUserConnectorInput } from './github-user-connector-input';
import { OpenAIUserConnectorInput } from './openai-user-connector-input';
import { SlackUserConnectorInput } from './slack-user-connector-input';
import { ZendeskConnectorInput } from './zendesk-connector-input';
import { ConnectorInputProps } from './types';

export const userConnectorInputs: Record<
  ConnectorType,
  React.FC<ConnectorInputProps>
> = {
  github: GitHubUserConnectorInput,
  slack: SlackUserConnectorInput,
  openai: OpenAIUserConnectorInput,
  zendesk: ZendeskConnectorInput,
};
