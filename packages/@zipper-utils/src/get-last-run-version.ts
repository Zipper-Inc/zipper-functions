import { AppInfo } from '@zipper/types';

export function getLastRunVersion(app?: AppInfo) {
  return (
    app?.lastDeploymentVersion ||
    new Date(app?.updatedAt || Date.now()).getTime().toString(36)
  );
}
