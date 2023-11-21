import { kv } from '@vercel/kv';
import { formatDeploymentId } from './deployment-id';

const DEPLOYMENT_FOR_SUBDOMAIN = 'DEPLOYMENT-FOR-SUBDOMAIN';
const BOOT_PAYLOAD = 'BOOT-PAYLOAD';

type DeploymentParams = {
  deploymentId?: string;
  appId?: string;
  version?: string;
};

const makeDeploymentId = ({
  deploymentId: deploymentIdPassedIn = '',
  appId = '',
  version = '',
}: DeploymentParams) =>
  deploymentIdPassedIn ||
  formatDeploymentId({
    appId: appId,
    version: version?.length > 7 ? version.slice(0, 7) : version,
  });

export const cacheDeployment = {
  key: (subdomain: string) => `${DEPLOYMENT_FOR_SUBDOMAIN}[${subdomain}]`,

  get: async (subdomain: string) => {
    const deploymentId = (await kv.get(
      cacheDeployment.key(subdomain),
    )) as string;
    const [appId, version] = deploymentId.split('@');
    return { deploymentId, appId, version };
  },

  set: async (
    subdomain: string,
    { deploymentId, appId = '', version = '' }: DeploymentParams,
  ) => {
    return kv.set(
      `${DEPLOYMENT_FOR_SUBDOMAIN}[${subdomain}]`,
      makeDeploymentId({ deploymentId, appId, version }),
    );
  },
};

export const cacheBootPayload = {
  key: ({ deploymentId, appId = '', version = '' }: DeploymentParams) =>
    `${BOOT_PAYLOAD}[${makeDeploymentId({ deploymentId, appId, version })}]`,

  get: async (args: DeploymentParams) => {
    const key = cacheBootPayload.key(args);
    return kv.get(key) as Promise<Zipper.BootPayload>;
  },
  set: async (args: DeploymentParams, payload: Zipper.BootPayload) => {
    const key = cacheBootPayload.key(args);
    return kv.set(key, payload);
  },
};
