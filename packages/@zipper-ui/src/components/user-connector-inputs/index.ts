import { UserAuthConnectorType } from '@zipper/types';
import { GitHubUserConnectorInput } from './github-user-connector-input';
import { SlackUserConnectorInput } from './slack-user-connector-input';
import { ConnectorInputProps } from './types';

export const userConnectorInputs: Record<
  UserAuthConnectorType,
  React.FC<ConnectorInputProps>
> = {
  github: GitHubUserConnectorInput,
  slack: SlackUserConnectorInput,
};
