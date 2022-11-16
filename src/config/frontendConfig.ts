import ThirdPartyEmailPassword, {
  Google,
} from 'supertokens-auth-react/recipe/thirdpartyemailpassword';
import Session from 'supertokens-auth-react/recipe/session';
import { appInfo } from './appInfo';

export const frontendConfig = () => {
  return {
    appInfo,
    recipeList: [
      ThirdPartyEmailPassword.init({
        signInAndUpFeature: {
          providers: [Google.init()],
        },
        useShadowDom: false,
        getRedirectionURL: async (context) => {
          if (context.action === 'SUCCESS') {
            if (context.redirectToPath !== undefined) {
              // we are navigating back to where the user was before they authenticated
              return context.redirectToPath;
            }
            return '/';
          }
          return undefined;
        },
        onHandleEvent: async (context) => {
          if (context.action !== 'SESSION_ALREADY_EXISTS') {
            if (context.action === 'SUCCESS') {
              if (context.isNewUser) {
                console.log('create new user here');
              } else {
                console.log('update last sign in');
              }
            }
          }
        },
      }),
      Session.init(),
    ],
  };
};
