import {
  ConnectorType,
  GithubConnectorUserAuthMetadata,
  SlackConnectorUserAuthMetadata,
} from '@zipper/types';

export type AuthedUser = {
  userId: string;
  username: string;
};

export const getAuthedGithubUser = (
  metadata: GithubConnectorUserAuthMetadata,
): AuthedUser => {
  return {
    userId: metadata?.id?.toString() || '',
    username: metadata?.login || '',
  };
};

export const getAuthedSlackUser = (
  metadata: SlackConnectorUserAuthMetadata,
): AuthedUser => {
  return { userId: metadata?.user_id || '', username: metadata?.user || '' };
};

export type AuthedConnectorType = Exclude<ConnectorType, 'openai' | 'notion'>;

export const authedUserGetters: Record<
  AuthedConnectorType,
  (metadata: any) => AuthedUser
> = {
  github: getAuthedGithubUser,
  slack: getAuthedSlackUser,
};
