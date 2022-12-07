import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import Session from 'supertokens-node/recipe/session';
import { appInfo } from './appInfo';
import { TypeInput } from 'supertokens-node/types';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '~/server/prisma';
import { Prisma } from '@prisma/client';

const { Google, Github } = ThirdPartyEmailPassword;

const accountUpdateArgs = (response: any) => {
  return {
    id: response.user.id,
    provider: response.user.thirdParty?.id || '',
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
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          }),
          Github({
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
          }),
        ],
        override: {
          apis: (ogImplementation) => {
            return {
              ...ogImplementation,
              emailPasswordSignUpPOST: async (input) => {
                if (ogImplementation.emailPasswordSignUpPOST === undefined) {
                  throw Error('Should never come here');
                }
                const response = await ogImplementation.emailPasswordSignUpPOST(
                  input,
                );
                if (response.status === 'OK') {
                  const { id, email } = response.user;
                  await prisma.user.create({
                    data: {
                      email,
                      registered: true,
                      superTokenId: id,
                    },
                  });
                }
                return response;
              },
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
                  console.log('ST sign up successful', response);

                  const newUser = await prisma.user.upsert({
                    where: {
                      email: response.user.email,
                    },
                    create: {
                      email: response.user.email,
                      superTokenId: response.user.id,
                      registered: true,
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

                  try {
                    if (input.provider.id === 'google') {
                      const client = new OAuth2Client(
                        process.env.GOOGLE_CLIENT_ID,
                      );
                      const ticket = await client.verifyIdToken({
                        idToken: response.authCodeResponse.id_token,
                        audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
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
                    }

                    if (input.provider.id === 'github') {
                      const raw = await fetch('https://api.github.com/user', {
                        headers: {
                          Authorization: `token ${response.authCodeResponse.access_token}`,
                        },
                      });
                      const res = await raw.json();

                      await prisma.user.update({
                        where: { id: newUser.id },
                        data: {
                          picture:
                            res.avatar ||
                            `https://avatars.githubusercontent.com/u/${response.user.thirdParty?.userId}?v=4`,
                          name: res.name,
                        },
                      });
                    }
                  } catch (error) {
                    console.log(
                      'Something went wrong in thirdPartySignInUpPOST: ',
                      error,
                    );
                    return {
                      ...response,
                      ok: false,
                    };
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
