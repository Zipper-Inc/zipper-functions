import ThirdPartyEmailPassword, {
  Google,
  Github,
} from 'supertokens-auth-react/recipe/thirdpartyemailpassword';
import Session from 'supertokens-auth-react/recipe/session';
import { appInfo } from './appInfo';
import ProviderButton from '~/components/auth/providerButton';
import OctocatIcon from '~/components/auth/octocatIcon';

export const frontendConfig = () => {
  return {
    appInfo,
    recipeList: [
      ThirdPartyEmailPassword.init({
        signInAndUpFeature: {
          providers: [
            Github.init({
              buttonComponent: ProviderButton({
                provider: 'GitHub',
                primary: true,
                icon: OctocatIcon(),
              }),
            }),
            Google.init({
              buttonComponent: ProviderButton({ provider: 'Google' }),
            }),
          ],
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
        palette: {
          superTokensBrandingBackground: 'white',
          superTokensBrandingText: 'white',
          primary: '#667085',
        },
      }),
      Session.init(),
    ],
  };
};
