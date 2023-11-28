const SEPARATOR = '@';

export const formatDeploymentId = ({
  appId,
  version,
  uniqueOverride,
}: {
  appId: string;
  version: string;
  uniqueOverride?: string;
}) => {
  const deploymentId = `${appId}${SEPARATOR}${version}`;
  return uniqueOverride ? `${deploymentId}--${uniqueOverride}` : deploymentId;
};

export const parseDeploymentId = (deploymentId: string) => {
  const [appId, version] = deploymentId.split(SEPARATOR) as [string, string];
  return { appId, version, deploymentId };
};
