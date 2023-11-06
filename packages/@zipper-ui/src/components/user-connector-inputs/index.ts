import { UserAuthConnectorType } from '@zipper/types';
import { GitHubUserConnectorInput } from './github-user-connector-input';
import { SlackUserConnectorInput } from './slack-user-connector-input';
import { ConnectorInputProps } from './types';

export const userConnectorInputs: Record<
  'github' | 'slack',
  React.FC<ConnectorInputProps>
> = {
  github: GitHubUserConnectorInput,
  slack: SlackUserConnectorInput,
};
