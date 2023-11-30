const SEPARATOR = '@';

export const formatDeploymentId = ({
  appId,
  version,
}: {
  appId: string;
  version: string;
}) => `${appId}${SEPARATOR}${version}`;

export const parseDeploymentId = (deploymentId: string) => {
  const [appId, version] = deploymentId.split(SEPARATOR) as [string, string];
  return { appId, version, deploymentId };
};
