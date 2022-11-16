import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import Session from 'supertokens-node/recipe/session';
import { appInfo } from './appInfo';
import { TypeInput } from 'supertokens-node/types';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '~/server/prisma';
import { Prisma } from '@prisma/client';

const { Google } = ThirdPartyEmailPassword;

const CLIENT_ID =
  '741243925686-9sqa2dt96nb7qgirb7f4pu2m8giq14gk.apps.googleusercontent.com';

const accountUpdateArgs = (response: any) => {
  return {
    provider: response.user.thirdParty?.id || 'google',
    providerAccountId: response.user.thirdParty?.userId || '',
    access_token: response.authCodeResponse.access_token,
    id_token: response.authCodeResponse.id_token,
    scope: response.authCodeResponse.scope,
    expires_at: new Date(
      Date.now() + response.authCodeResponse.expires_in * 1000,
    ),
  } as Prisma.XOR<
    Prisma.ThirdPartyAccountCreateWithoutUserInput,
    Prisma.ThirdPartyAccountUncheckedCreateWithoutUserInput
  >;
};

export const backendConfig = (): TypeInput => {
  return {
    framework: 'express',
    supertokens: {
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI:
        'https://d7410151656411ed894f6dbd802536e9-us-east-1.aws.supertokens.io:3567',
      apiKey: process.env.SUPERTOKENS_API_KEY,
    },
    appInfo,
    recipeList: [
      ThirdPartyEmailPassword.init({
        providers: [
          // We have provided you with development keys which you can use for testing.
          // IMPORTANT: Please replace them with your own OAuth keys for production use.
          Google({
            clientId: CLIENT_ID,
            clientSecret: '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',
          }),
        ],
        override: {
          apis: (ogImplementation) => {
            console.log(ogImplementation);
            return {
              ...ogImplementation,
              thirdPartySignInUpPOST: async (input) => {
                if (ogImplementation.thirdPartySignInUpPOST === undefined) {
                  throw Error('Should never come here');
                }

                // First we call the original implementation
                const response = await ogImplementation.thirdPartySignInUpPOST(
                  input,
                );

                // Post sign up response, we check if it was successful
                if (response.status === 'OK') {
                  console.log(
                    'ST sign up successful',
                    response.authCodeResponse,
                  );

                  const newUser = await prisma.user.upsert({
                    where: {
                      superTokenId: response.user.id,
                    },
                    create: {
                      superTokenId: response.user.id,
                      email: response.user.email,
                      thirdPartyAccounts: {
                        create: accountUpdateArgs(response),
                      },
                    },
                    update: {
                      thirdPartyAccounts: {
                        upsert: {
                          where: {
                            providerAccountId: response.user.thirdParty?.userId,
                          },
                          create: accountUpdateArgs(response),
                          update: accountUpdateArgs(response),
                        },
                      },
                    },
                    select: { id: true },
                  });

                  if (input.provider.id === 'google') {
                    try {
                      const client = new OAuth2Client(CLIENT_ID);
                      const ticket = await client.verifyIdToken({
                        idToken: response.authCodeResponse.id_token,
                        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
                        // Or, if multiple clients access the backend:
                        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
                      });
                      const payload = ticket.getPayload();
                      console.log('Google profile lookup successful');
                      await prisma.user.update({
                        where: {
                          id: newUser.id,
                        },
                        data: {
                          name: payload?.name,
                          picture: payload?.picture,
                        },
                      });
                    } catch (error) {
                      console.log(
                        'Something went wrong in thirdPartySignInUpPOST: ',
                        error,
                      );
                    }
                  }
                }
                return response;
              },
            };
          },
        },
      }),
      Session.init(),
    ],
  };
};
