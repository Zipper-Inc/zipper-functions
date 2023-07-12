// @ts-check
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { z } = require('zod');

/*eslint sort-keys: "error"*/
const envSchema = z.object({
  CLOUDFLARE_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_ACCESS_KEY_SECRET: z.string(),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_APPLET_SRC_BUCKET_NAME: z.string(),
  CLOUDFLARE_BUILD_FILE_BUCKET_NAME: z.string(),
  DATABASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string(),
  FEEDBACK_TRACKER_API_KEY: z.string(),
  HMAC_SIGNING_SECRET: z.string(),
  JWT_REFRESH_SIGNING_SECRET: z.string(),
  JWT_SIGNING_SECRET: z.string(),
  LIVEBLOCKS_PUBLIC_KEY: z.string(),
  NEXTAUTH_GITHUB_CLIENT_ID: z.string(),
  NEXTAUTH_GITHUB_CLIENT_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_GOOGLE_CLIENT_ID: z.string(),
  NEXTAUTH_GOOGLE_CLIENT_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST: z.string(),
  NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME: z.string(),
  NEXT_PUBLIC_SLACK_CLIENT_ID: z.string(),
  NEXT_PUBLIC_ZIPPER_API_URL: z.string(),
  NEXT_PUBLIC_ZIPPER_DOT_DEV_URL: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PUBLICLY_ACCESSIBLE_RPC_HOST: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  RESEND_API_KEY: z.string(),
  DENO_DEPLOY_SECRET: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(env.error.format(), null, 4),
  );
  process.exit(1);
}
module.exports.env = env.data;
