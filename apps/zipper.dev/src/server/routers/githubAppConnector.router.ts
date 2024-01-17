/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../prisma';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import {
  decryptFromHex,
  encryptToBase64,
  encryptToHex,
  safeJSONParse,
} from '@zipper/utils';
import { createTRPCRouter, publicProcedure } from '../root';
import { Project, SyntaxKind } from 'ts-morph';

const GH_APP_SCRIPT_NAME = 'github-app-connector';
const GH_APP_SETTING_NAME = 'github-app-connector-app-setting';
export const githubAppConnectorRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppReadPermission({ ctx, appId: input.appId });
      const script = await prisma.script.findFirst({
        where: {
          appId: input.appId,
          name: GH_APP_SCRIPT_NAME,
        },
      });
      if (!script) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Script not found',
        });
      }
      const project = new Project();
      const sourceFile = project.createSourceFile('tempFile.ts', script.code);
      const variableDeclaration = sourceFile.getVariableDeclaration(
        'githubAppConnectorConfig',
      );
      const extractedObject = variableDeclaration
        /**
         * Extracts and transforms properties from an object literal in a variable declaration.
         * It iterates over the properties of the object, focusing on PropertyAssignments.
         * For string and numeric literals, it directly captures their values.
         * For array literals, it converts each element to a string, removing quotes.
         * The result is a new object with these transformed properties.
         */
        ?.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getProperties()
        .reduce((acc, p) => {
          if (p.isKind(SyntaxKind.PropertyAssignment)) {
            const name = p.getName();
            const initializer = p.getInitializer();

            if (
              initializer?.isKind(SyntaxKind.StringLiteral) ||
              initializer?.isKind(SyntaxKind.NumericLiteral)
            ) {
              acc[name] = initializer.getLiteralValue();
            } else if (initializer?.isKind(SyntaxKind.ArrayLiteralExpression)) {
              acc[name] = initializer
                .getElements()
                .map((a) => a.getText().replace(/"/g, ''));
            }
          }
          return acc;
        }, {} as any);

      const metadata = await prisma.appSetting.findFirst({
        where: {
          appId: input.appId,
          settingName: GH_APP_SETTING_NAME,
        },
      });
      return {
        scopes: extractedObject.scopes,
        organization: extractedObject.clientId,
        events: extractedObject.events,
        metadata: safeJSONParse(metadata?.settingValue, undefined, null),
      };
    }),
  getStateValue: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        postInstallationRedirect: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await hasAppReadPermission({ ctx, appId: input.appId });

      const { appId, postInstallationRedirect } = input;

      return encryptToHex(
        `${appId}::${postInstallationRedirect || ''}`,
        process.env.ENCRYPTION_KEY || '',
      );
    }),
  delete: publicProcedure
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { appId } }) => {
      await hasAppEditPermission({ ctx, appId });

      await prisma.appSetting.deleteMany({
        where: {
          appId,
          settingName: GH_APP_SETTING_NAME,
        },
      });

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_APP_ID',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_WEBHOOK_SECRET',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_CLIENT_SECRET',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      try {
        await prisma.secret.delete({
          where: {
            appId_key: {
              appId,
              key: 'GITHUB_PEM',
            },
          },
        });
      } catch (e) {
        // ignore
      }

      return true;
    }),
  exchangeManifestCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      let appId: string | undefined;
      let redirectTo: string | undefined;
      try {
        const decryptedState = decryptFromHex(
          input.state,
          process.env.ENCRYPTION_KEY!,
        );
        [appId, redirectTo] = decryptedState.split('::');
      } catch (e) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (!appId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const res = await fetch(
        `https://api.github.com/app-manifests/${input.code}/conversions`,
        {
          method: 'post',
        },
      );

      const json = await res.json();

      if (json.message) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: json.message });
      }

      const secretKeys = ['webhook_secret', 'pem', 'client_secret'];

      const secrets = secretKeys.reduce((acc, key) => {
        let valueToStore = json[key];
        if (!valueToStore) return acc;
        if (key === 'pem') {
          valueToStore = json[key].toString('base64');
        }

        const secretKey = `GITHUB_${key.toUpperCase()}`;
        const secretValue = encryptToBase64(
          valueToStore,
          process.env.ENCRYPTION_KEY!,
        );
        acc.push({ key: secretKey, value: secretValue });
        return acc;
      }, [] as Record<'key' | 'value', string>[]);

      await Promise.all(
        secrets.map((secret) =>
          prisma.secret.upsert({
            where: {
              appId_key: {
                appId: appId!,
                key: secret.key,
              },
            },
            create: {
              appId,
              key: secret.key,
              encryptedValue: secret.value,
            },
            update: {
              encryptedValue: secret.value,
            },
          }),
        ),
      );

      secretKeys.forEach((key) => {
        delete json[key];
      });

      // useful to have the app id because it's required to make API calls
      await prisma.secret.upsert({
        where: {
          appId_key: {
            appId: appId!,
            key: 'GITHUB_APP_ID',
          },
        },
        create: {
          appId,
          key: 'GITHUB_APP_ID',
          encryptedValue: encryptToBase64(
            json.id.toString(),
            process.env.ENCRYPTION_KEY!,
          ),
        },
        update: {
          encryptedValue: encryptToBase64(
            json.id.toString(),
            process.env.ENCRYPTION_KEY!,
          ),
        },
      });
      const app = await prisma.app.findUnique({
        where: {
          id: appId!,
        },
      });
      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: app!.organizationId || app!.createdById,
        },
      });

      await prisma.appSetting.create({
        data: {
          appId: appId!,
          settingName: GH_APP_SETTING_NAME,
          settingValue: JSON.stringify(json),
        },
      });

      return {
        app: { ...app, resourceOwner },
        redirectTo,
      };
    }),
});
