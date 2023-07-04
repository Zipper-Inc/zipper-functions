import NextAuth, {
  AuthOptions,
  TokenSet,
  SessionStrategy,
  DefaultSession,
} from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider, {
  SendVerificationRequestParams,
} from 'next-auth/providers/email';
import { prisma } from '~/server/prisma';
import { PrismaClient } from '@prisma/client';
import { Adapter, AdapterAccount } from 'next-auth/adapters';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ResourceOwnerType, UserRole } from '@zipper/types';
import { MagicLinkEmail } from '~/../emails';
import fetch from 'node-fetch';
import { createUserSlug } from '~/utils/create-user-slug';
import { resend } from '~/server/resend';
import crypto from 'crypto';

export function PrismaAdapter(p: PrismaClient): Adapter {
  return {
    createUser: async (data, { shouldCreateResourceOwnerSlug = true } = {}) => {
      const slug = await createUserSlug({ name: data.name, email: data.email });
      const user = await p.user.create({
        data: { ...data, slug },
      });

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

      // add the user to the default organization if one is set in the allow list
      // NOTE: this doesn't handle blocking users from signing up - that happens in the signIn callback
      const domain = data.email.split('@')[1];
      if (domain) {
        const allowListIdentifier = await p.allowListIdentifier.findFirst({
          where: { value: { in: [data.email, domain] } },
        });

        if (allowListIdentifier && allowListIdentifier.defaultOrganizationId) {
          const existingMemberCount = await p.organizationMembership.count({
            where: {
              organizationId: allowListIdentifier?.defaultOrganizationId,
            },
          });

          const role =
            existingMemberCount === 0 ? UserRole.Admin : UserRole.Member;

          await p.organizationMembership.upsert({
            where: {
              organizationId_userId: {
                organizationId: allowListIdentifier.defaultOrganizationId,
                userId: user.id,
              },
            },
            create: {
              organizationId: allowListIdentifier.defaultOrganizationId,
              userId: user.id,
              role,
            },
            update: {},
          });
        }
      }

      return user;
    },
    getUser: (id) => p.user.findUnique({ where: { id } }),
    getUserByEmail: (email) => p.user.findUnique({ where: { email } }),
    async getUserByAccount(provider_providerAccountId) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId },
        select: { user: true },
      });
      return account?.user ?? null;
    },
    updateUser: ({ id, ...data }) => p.user.update({ where: { id }, data }),
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

async function refreshAccessToken(token: TokenSet) {
  try {
    // https://accounts.google.com/.well-known/openid-configuration
    // We need the `token_endpoint`.
    if (!token.refresh_token) throw new Error('No refresh token');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXTAUTH_GOOGLE_CLIENT_ID!,
        client_secret: process.env.NEXTAUTH_GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
      method: 'POST',
    });

    const tokens = await response.json();

    if (!response.ok) throw tokens;

    return {
      ...token, // Keep the previous token properties
      access_token: tokens.access_token,
      // expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
      // Fall back to old refresh token, but note that
      // many providers may only allow using a refresh token once.
      refresh_token: tokens.refresh_token ?? token.refresh_token,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    // The error property will be used client-side to handle the refresh token error
    return { ...token, error: 'RefreshAccessTokenError' as const };
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
    strategy: 'jwt' as SessionStrategy,
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      name: 'Email',
      server: '',
      from: 'Zipper<yourfriends@zipper.dev>',
      maxAge: 600, // 10 minutes
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
    // ...add more providers here
  ],
  callbacks: {
    async signIn({ user }) {
      if (process.env.IGNORE_ALLOW_LIST) return true;
      // every user signing in should have an email address
      if (!user.email) return false;
      const emailDomain = user.email.split('@')[1];
      if (!emailDomain) return false;

      // check if the user is allowed to sign in
      const allowed = await prisma.allowListIdentifier.findFirst({
        where: { value: { in: [user.email, emailDomain] } },
      });

      return !!allowed;
    },
    async jwt({ token: _token, user, account, trigger, session }) {
      const token = { ..._token };
      // Initial sign in (only time account is not null)
      if (account) {
        // Save the access token and refresh token in the JWT on the initial login
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
          slug: user.slug,
          organizationMemberships: await getOrganizationMemberships(
            user.id,
            user.email,
          ),
        };
      }

      if (trigger === 'update') {
        console.log('update triggered: ', session);

        if (session.updateOrganizationList) {
          token.organizationMemberships = await getOrganizationMemberships(
            token.sub,
            token.email,
          );
        }

        if (session.currentOrganizationId === null) {
          token.currentOrganizationId = undefined;
        }

        if (session.currentOrganizationId) {
          if (
            token.organizationMemberships?.find(
              (m) => m.organization.id === session.currentOrganizationId,
            )
          ) {
            token.currentOrganizationId = session.currentOrganizationId;
          }
        }
      }

      if (!token.expires_at) return token;

      // Not initial sign in
      // token is still good; carry on
      if (Date.now() < token.expires_at * 1000) {
        // If the access token has not expired yet, return it
        return token;
      }

      // If the access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token, trigger }) {
      try {
        session.error = token.error;
        session.user = {
          id: token.sub,
          name: token.name,
          email: token.email,
          image: token.picture,
          username: token.slug,
        };

        if (trigger !== 'update') {
          session.organizationMemberships = token.organizationMemberships;
          session.currentOrganizationId = token.currentOrganizationId;
        }

        return session;
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
    async signIn({ user }) {
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
  }
}

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  id?: string | null;
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
