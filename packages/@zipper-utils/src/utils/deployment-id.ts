const separator = '@';

export const formatDeploymentId = ({
  appId,
  version,
  branch,
}: {
  appId: string;
  version: string;
  branch?: string;
}) => {
  const deploymentId = `${appId}${separator}${version}${separator}${
    branch || 'main'
  }`;

  return deploymentId;
};

export const parseDeploymentId = (deploymentId: string) => {
  const [appId, version, branch] = deploymentId.split(separator);
  return { appId, version, branch: branch || 'main' };
};
