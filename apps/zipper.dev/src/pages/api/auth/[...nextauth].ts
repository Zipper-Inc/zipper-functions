import NextAuth, { AuthOptions, Session, SessionStrategy } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider, {
  SendVerificationRequestParams,
} from 'next-auth/providers/email';
import { prisma } from '~/server/prisma';
import { PrismaClient, UserSetting } from '@prisma/client';
import { Adapter, AdapterAccount } from 'next-auth/adapters';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ResourceOwnerType } from '@zipper/types';
import { MagicLinkEmail } from '~/emails';
import { createUserSlug } from '~/utils/create-user-slug';
import { resend } from '~/server/resend';
import crypto from 'crypto';
import { trackEvent } from '~/utils/api-analytics';
import { forkAppletBySlug } from '~/server/routers/app.router';
import { captureException } from '@sentry/nextjs';

export function PrismaAdapter(p: PrismaClient): Adapter {
  return {
    createUser: async (data, { shouldCreateResourceOwnerSlug = true } = {}) => {
      const { settings, ...remaining } = data;
      const slug = await createUserSlug({ name: data.name, email: data.email });
      const user = await p.user.create({
        data: { ...remaining, slug },
      });

      if (process.env.DEFAULT_APP_SLUG) {
        try {
          forkAppletBySlug({
            appSlug: process.env.DEFAULT_APP_SLUG,
            name: `Welcome ${slug}`,
            userId: user.id,
            connectToParent: false,
          });
        } catch (e) {
          captureException(e);
        }
      }

      if (shouldCreateResourceOwnerSlug) {
        // create a resource owner slug for the user - this makes sure that slugs
        // are unique across all resource owners (users and organizations)
        await p.resourceOwnerSlug.create({
          data: {
            slug,
            resourceOwnerType: ResourceOwnerType.User,
            resourceOwnerId: user.id,
          },
        });
      }

      return user;
    },
    getUser: (id) =>
      p.user.findUnique({ where: { id }, include: { settings: true } }),
    getUserByEmail: (email) =>
      p.user.findUnique({ where: { email }, include: { settings: true } }),
    async getUserByAccount(provider_providerAccountId) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId },
        select: { user: { include: { settings: true } } },
      });
      return account?.user ?? null;
    },
    updateUser: ({ id, settings, ...data }) =>
      p.user.update({ where: { id }, data }),
    deleteUser: (id) => p.user.delete({ where: { id } }),
    linkAccount: (data) => {
      return p.account.create({ data }) as unknown as AdapterAccount;
    },
    unlinkAccount: (provider_providerAccountId) =>
      p.account.delete({
        where: { provider_providerAccountId },
      }) as unknown as AdapterAccount,
    async getSessionAndUser(sessionToken) {
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession;
      return { user, session };
    },
    createSession: (data) => p.session.create({ data }),
    updateSession: (data) =>
      p.session.update({ where: { sessionToken: data.sessionToken }, data }),
    deleteSession: (sessionToken) =>
      p.session.delete({ where: { sessionToken } }),
    async createVerificationToken(data) {
      const existingToken = await p.verificationToken.findFirst({
        where: { identifier: data.identifier },
      });

      if (existingToken) {
        await p.verificationToken.delete({
          where: { token: existingToken.token },
        });
      }

      const verificationToken = await p.verificationToken.create({ data });
      // @ts-expect-errors // MongoDB needs an ID, but we don't
      if (verificationToken.id) delete verificationToken.id;
      return verificationToken;
    },
    async useVerificationToken(identifier_token) {
      try {
        // we're not deleting these tokens in case email servers and/or clients
        // make GET requests to the magic link url
        const verificationToken = await p.verificationToken.findFirst({
          where: {
            identifier: identifier_token.identifier,
            token: identifier_token.token,
            expires: { gt: new Date() },
          },
        });
        // @ts-expect-errors // MongoDB needs an ID, but we don't
        if (verificationToken.id) delete verificationToken.id;
        return verificationToken;
      } catch (error) {
        // If token already used/deleted, just return null
        // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
        if ((error as PrismaClientKnownRequestError).code === 'P2025')
          return null;
        throw error;
      }
    },
  };
}

async function refreshAccessToken(session: Session) {
  try {
    // https://accounts.google.com/.well-known/openid-configuration
    // We need the `token_endpoint`.

    // get the refresh token from the account table
    if (!session.user?.id) throw new Error('No user id');

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
      select: { refresh_token: true, id: true, access_token: true },
    });

    if (!account?.refresh_token) throw new Error('No refresh token');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXTAUTH_GOOGLE_CLIENT_ID!,
        client_secret: process.env.NEXTAUTH_GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
      method: 'POST',
    });

    const tokens = await response.json();

    if (!response.ok) throw tokens;

    const currentTimestampInSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = currentTimestampInSeconds + tokens.expires_in;

    // Refresh was successful, update the account in the database with the new tokens
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        access_token: tokens.access_token,
        expires_at: expiresAt,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      },
    });

    return {
      ...session,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    // The error property will be used client-side to handle the refresh token error
    return { ...session, error: 'RefreshAccessTokenError' as const };
  }
}

const getOrganizationMemberships = async (
  userId?: string,
  email?: string | null,
) => {
  if (!userId) return [];
  const orgMemberships = await prisma.organizationMembership.findMany({
    where: { userId },
    select: {
      organization: {
        select: { name: true, id: true, slug: true },
      },
      role: true,
    },
  });

  const pendingOrgMemberships = email
    ? await prisma.organizationInvitation.findMany({
        where: { email },
        select: {
          organization: {
            select: { name: true, id: true, slug: true },
          },
          role: true,
        },
      })
    : [];

  return [
    ...orgMemberships.map((m) => ({ ...m, pending: false })),
    ...pendingOrgMemberships.map((m) => ({ ...m, pending: true })),
  ];
};

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  session: {
    strategy: 'database' as SessionStrategy,
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: '',
      from: 'Zipper<yourfriends@zipper.dev>',
      maxAge: 300, // 5 minutes
      generateVerificationToken() {
        const s = crypto.randomBytes(16).toString('hex');

        return `${s.substring(0, 5)}-${s.substring(6, 11)}`;
      },
      sendVerificationRequest: async (
        params: SendVerificationRequestParams,
      ) => {
        try {
          const { identifier, url, token } = params;

          await resend.emails.send({
            to: identifier,
            from: 'Zipper <yourfriends@zipper.dev>',
            subject: '[Zipper] Your login link',
            react: MagicLinkEmail({ loginUrl: url, token }),
          });
        } catch (error) {
          console.error(error);
        }
      },
    }),
    GithubProvider({
      clientId: process.env.NEXTAUTH_GITHUB_CLIENT_ID!,
      clientSecret: process.env.NEXTAUTH_GITHUB_CLIENT_SECRET!,
      // IMPORTANT
      // allowDangerousEmailAccountLinking should only be used with providers
      // that verify email addresses. See https://github.com/nextauthjs/next-auth/issues/519#issuecomment-696673600
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.NEXTAUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXTAUTH_GOOGLE_CLIENT_SECRET!,
      // IMPORTANT
      // allowDangerousEmailAccountLinking should only be used with providers
      // that verify email addresses. See https://github.com/nextauthjs/next-auth/issues/519#issuecomment-696673600
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user, trigger, newSession }) {
      try {
        session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.slug,
          newUser: user.newUser,
          settings: user.settings,
          createdAt: user.createdAt,
        };

        session.organizationMemberships = await getOrganizationMemberships(
          user.id,
          user.email,
        );

        if (trigger === 'update') {
          console.log('update triggered: ', session);

          if (newSession.updateOrganizationList) {
            session.organizationMemberships = await getOrganizationMemberships(
              user.id,
              user.email,
            );
          }

          if (newSession.currentOrganizationId === null) {
            session.currentOrganizationId = undefined;
          }

          if (newSession.updateProfile) {
            const userUpdated = await prisma.user.findUnique({
              where: { id: user.id },
              include: { settings: true },
            });

            session.user.image = userUpdated?.image;
            session.user.name = userUpdated?.name;
            session.user.email = userUpdated?.email;
            session.user.username = userUpdated?.slug;
            session.user.settings = userUpdated?.settings;
          }

          if (newSession.currentOrganizationId) {
            if (
              session.organizationMemberships?.find(
                (m) => m.organization.id === newSession.currentOrganizationId,
              )
            ) {
              session.currentOrganizationId = newSession.currentOrganizationId;
            }
          }
        }

        // check if we need to refresh the token from google in the accounts table
        // if the access token is expired, we need to refresh it
        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: 'google',
          },
          select: { refresh_token: true, expires_at: true },
        });

        if (!account?.refresh_token) return session;

        if (account.expires_at) {
          const expiresAt = new Date(account.expires_at * 1000);
          const today = new Date();

          if (today > expiresAt) {
            return refreshAccessToken(session);
          }

          // if (expiresAt > new Date()) return session;
        }

        // session.expires is a string, need to convert it and compare it to now to see if it's expired
        const expiresAt = new Date(session.expires);
        if (expiresAt > new Date()) return session;

        // If the access token has expired, try to refresh it
        return refreshAccessToken(session);

        // Do we still need to refresh tokens? is that the OAuth tokens from external providers???
      } catch (e) {
        console.error(e);
        return session;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  events: {
    async signIn({ user, isNewUser, account }) {
      const pending = await prisma.pendingAppEditor.findMany({
        where: {
          email: user.email!,
        },
      });

      await prisma.pendingAppEditor.deleteMany({
        where: {
          email: user.email!,
        },
      });

      await prisma.appEditor.createMany({
        data: pending.map((pendingAppEditor) => ({
          appId: pendingAppEditor.appId,
          isOwner: pendingAppEditor.isOwner,
          userId: user.id,
        })),
      });

      if (isNewUser && user.email) {
        resend.emails.send({
          to: user.email,
          from: 'Sachin & Ibu <founders@zipper.dev>',
          reply_to: ['sachin@zipper.works', 'ibu@zipper.works'],
          subject: 'Thank you for checking out Zipper',
          text: `Hey there,

We just wanted to drop you a quick note to say thank you for checking out Zipper.

If you have any questions, feedback, or general comments, we'd genuinely love to hear them. Feel free to reply to this email at any point - your emails go directly into our inboxes (and not a general mailbox or support queue).

Regards,
Sachin & Ibu
`,
        });
      }
      // try to find and delete any pending verification tokens
      const verificationToken = await prisma.verificationToken.findFirst({
        where: { identifier: user.email! },
      });

      if (verificationToken) {
        await prisma.verificationToken.delete({
          where: { token: verificationToken.token },
        });
      }

      // if the account provider is google we will need to refresh the access token at some point
      // we need to store the refresh token in the session so that we can refresh the access token

      trackEvent({
        userId: user.id,
        eventName: isNewUser ? 'Signed Up' : 'Logged In',
        properties: {
          provider: account?.provider || 'UNKNOWN',
        },
      });
    },
  },
};

export default NextAuth(authOptions);

declare module 'next-auth' {
  interface Session {
    error?: 'RefreshAccessTokenError';
    username?: string;
    organizationMemberships?: SessionOrganizationMembership[];
    currentOrganizationId?: string;
    user?: SessionUser;
  }

  interface User {
    slug?: string;
    newUser?: boolean;
    settings?: UserSetting[];
    createdAt?: Date;
  }
}

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  id?: string | null;
  newUser?: boolean | null;
  settings?: UserSetting[];
  createdAt?: Date;
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
    error?: 'RefreshAccessTokenError';
    organizationMemberships?: SessionOrganizationMembership[];
    currentOrganizationId?: string;
    slug?: string;
    newUser?: boolean;
    settings?: UserSetting[];
    userCreatedAt?: Date;
  }
}

export interface SessionOrganizationMembership {
  organization: SessionOrganization;
  role: string;
  pending: boolean;
}

export interface SessionOrganization {
  id: string;
  name: string;
  slug: string;
}
