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

export const authedUserGetters: Record<
  ConnectorType,
  (metadata: any) => AuthedUser
> = {
  github: getAuthedGithubUser,
  slack: getAuthedSlackUser,
};
