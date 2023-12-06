import { initLocalApplet } from './local-applet';

type SlackConfig = {
  zipperAppId: string;
  clientId?: string;
  userScopes: string[];
  botScopes: string[];
  postInstallRedirect?: string;
};
/**
 * Retrieves the Slack configuration from the provided script code.
 * @param scriptCode The script code containing the Slack configuration.
 * @returns The Slack configuration object.
 */
export const getSlackConfig = async (
  appSlug: string,
): Promise<SlackConfig | undefined> => {
  try {
    const res = await initLocalApplet(appSlug)
      .path('slack-connector')
      .run({ action: 'get-config' });
    return res as SlackConfig;
  } catch {
    return undefined;
  }
};
