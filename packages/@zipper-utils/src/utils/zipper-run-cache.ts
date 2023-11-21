import { createClient } from '@vercel/kv';
import { BootInfo } from '../../../@zipper-types/src/types/boot-info';
import { formatDeploymentId } from './deployment-id';

const DEPLOYMENT_FOR_SUBDOMAIN = 'DEPLOYMENT-FOR-SUBDOMAIN';
const BOOT_PAYLOAD = 'BOOT-PAYLOAD';

export type DeploymentParams = {
  deploymentId: string;
  appId: string;
  version: string;
};

type BootPayload = Zipper.BootPayload & { bootInfo: BootInfo };

const kv = createClient({
  url: process.env.BOOT_PAYLOAD_KV_REST_API_URL as string,
  token: process.env.BOOT_PAYLOAD_KV_REST_API_TOKEN as string,
});

const makeDeploymentId = ({
  deploymentId: deploymentIdPassedIn = '',
  appId = '',
  version = '',
}: Partial<DeploymentParams>) =>
  deploymentIdPassedIn ||
  formatDeploymentId({
    appId: appId,
    version: version?.length > 7 ? version.slice(0, 7) : version,
  });

export const cacheDeployment = {
  key: (subdomain: string) => `${DEPLOYMENT_FOR_SUBDOMAIN}[${subdomain}]`,

  get: async (subdomain: string): Promise<DeploymentParams> => {
    const deploymentId =
      (await kv.get<string>(cacheDeployment.key(subdomain))) || '';
    const [appId, version] = deploymentId.split('@');
    return { deploymentId, appId: appId || '', version: version || '' };
  },

  set: async (
    subdomain: string,
    { deploymentId, appId = '', version = '' }: Partial<DeploymentParams>,
  ) => {
    return kv.set(
      `${DEPLOYMENT_FOR_SUBDOMAIN}[${subdomain}]`,
      makeDeploymentId({ deploymentId, appId, version }),
    );
  },
};

export const cacheBootPayload = {
  key: ({
    deploymentId,
    appId = '',
    version = '',
  }: Partial<DeploymentParams>) =>
    `${BOOT_PAYLOAD}[${makeDeploymentId({ deploymentId, appId, version })}]`,

  get: async (args: Partial<DeploymentParams>) => {
    const key = cacheBootPayload.key(args);
    return kv.get<BootPayload>(key);
  },

  set: async (args: Partial<DeploymentParams>, payload: BootPayload) => {
    const key = cacheBootPayload.key(args);
    return kv.set(key, payload);
  },
};
