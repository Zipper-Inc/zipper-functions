const separator = '@';

export const formatDeploymentId = ({
  appId,
  version,
}: {
  appId: string;
  version: string;
}) => {
  const deploymentId = `${appId}${separator}${version}`;

  return deploymentId;
};

export const parseDeploymentId = (deploymentId: string) => {
  const [appId, version] = deploymentId.split(separator);
  return { appId, version };
};
