import { ConnectorType } from '@zipper/types';
import { GithubUserConnectorInput } from './github-user-connector-input';
import { SlackUserConnectorInput } from './slack-user-connector-input';
import { ConnectorInputProps } from './types';

export const userConnectorInputs: Record<
  ConnectorType,
  React.FC<ConnectorInputProps>
> = {
  github: GithubUserConnectorInput,
  slack: SlackUserConnectorInput,
};
