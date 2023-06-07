/**
 * Path to main handler
 * Hard requirement for now
 */
export const MAIN_PATH = 'main.ts';

/**
 * Path the internal boot path
 */
export const BOOT_PATH = '__BOOT__';

/**
 * List of env vars we don't want users to have access to
 * i.e. secrets and internal stuff
 */
export const ENV_BLOCKLIST = ['HMAC_SIGNING_SECRET'];
