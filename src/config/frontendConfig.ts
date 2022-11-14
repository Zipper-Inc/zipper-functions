import ThirdPartyPasswordlessReact from 'supertokens-auth-react/recipe/thirdpartypasswordless';
import SessionReact from 'supertokens-auth-react/recipe/session';
import ThirdPartyEmailPassword, {
  Google,
} from 'supertokens-auth-react/recipe/thirdpartyemailpassword';

import { appInfo } from './appInfo';

export const frontendConfig = () => {
  return {
    appInfo,
    recipeList: [
      ThirdPartyEmailPassword.init({
        signInAndUpFeature: {
          providers: [Google.init()],
        },
      }),
      ThirdPartyPasswordlessReact.init({
        contactMethod: 'EMAIL',
      }),
      SessionReact.init(),
    ],
  };
};
