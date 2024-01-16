import { createClient, VercelKV } from '@vercel/kv';
import { BootPayload } from '@zipper/types';
import { formatDeploymentId } from './deployment-id';

const DEPLOYMENT_FOR_SUBDOMAIN = 'DEPLOYMENT-FOR-SUBDOMAIN';
const BOOT_PAYLOAD = 'BOOT-PAYLOAD';

export type DeploymentParams = {
  deploymentId: string;
  appId: string;
  version: string;
};

let client: VercelKV;

const getClient = () => {
  if (!client) {
    client = createClient({
      url: process.env.BOOT_PAYLOAD_KV_REST_API_URL as string,
      token: process.env.BOOT_PAYLOAD_KV_REST_API_TOKEN as string,
      automaticDeserialization: true,
    });
  }
  return client;
};

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
  key: (subdomain: string) =>
    process.env.NODE_ENV === 'production'
      ? `${DEPLOYMENT_FOR_SUBDOMAIN}[${subdomain}]`
      : `${DEPLOYMENT_FOR_SUBDOMAIN}[${subdomain}]--${process.env.PUBLICLY_ACCESSIBLE_RPC_HOST}`,

  get: async (subdomain: string): Promise<DeploymentParams | void> => {
    const kv = getClient();
    const deploymentId = await kv.get<string>(cacheDeployment.key(subdomain));
    if (!deploymentId) return;

    const [appId, version] = deploymentId.split('@');
    return { deploymentId, appId: appId || '', version: version || '' };
  },

  set: async (
    subdomain: string,
    { deploymentId, appId = '', version = '' }: Partial<DeploymentParams>,
  ) => {
    const kv = getClient();
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
    const kv = getClient();
    const key = cacheBootPayload.key(args);
    return kv.get<BootPayload>(key);
  },

  set: async (args: Partial<DeploymentParams>, payload: BootPayload) => {
    const kv = getClient();
    const key = cacheBootPayload.key(args);
    return kv.set(key, payload);
  },
};
