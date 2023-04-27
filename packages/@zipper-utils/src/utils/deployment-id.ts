const separator = '@';

export const formatDeploymentId = ({
  appId,
  version,
  userId,
}: {
  appId: string;
  version: string;
  userId?: string;
}) => {
  const deploymentId = `${appId}${separator}${version}`;

  if (userId) {
    return `${deploymentId}${separator}${userId}`;
  }

  return deploymentId;
};

export const parseDeploymentId = (deploymentId: string) => {
  const [appId, version, userId] = deploymentId.split(separator);
  return { appId, version, userId };
};
