// @ts-check
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { z } = require('zod');

/*eslint sort-keys: "error"*/
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DENO_DEPLOY_TOKEN: z.string(),
  ENCRYPTION_KEY: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  LIVEBLOCKS_PUBLIC_KEY: z.string(),
  NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME: z.string(),
  NEXT_PUBLIC_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PARSE_INPUT_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  RELAY_URL: z.string().url(),
  SHARED_SECRET: z.string(),
  SUPERTOKENS_API_KEY: z.string(),
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
