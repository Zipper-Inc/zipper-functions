import ThirdPartyPasswordlessNode from 'supertokens-node/recipe/thirdpartypasswordless';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import SessionNode from 'supertokens-node/recipe/session';
import { appInfo } from './appInfo';
import { TypeInput } from 'supertokens-node/types';

const { Google } = ThirdPartyEmailPassword;

export const backendConfig = (): TypeInput => {
  return {
    framework: 'express',
    supertokens: {
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI: 'https://try.supertokens.com',
      // apiKey: <API_KEY(if configured)>,
    },
    appInfo,
    recipeList: [
      ThirdPartyEmailPassword.init({
        providers: [
          // We have provided you with development keys which you can use for testing.
          // IMPORTANT: Please replace them with your own OAuth keys for production use.
          Google({
            clientId:
              '1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com',
            clientSecret: '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',
          }),
        ],
      }),
      ThirdPartyPasswordlessNode.init({
        flowType: 'MAGIC_LINK',
        contactMethod: 'EMAIL',
      }),
      SessionNode.init(),
    ],
    isInServerlessEnv: true,
  };
};
