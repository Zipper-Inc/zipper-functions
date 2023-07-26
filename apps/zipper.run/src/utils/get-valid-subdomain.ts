import { ZIPPER_PREVIEW_PROXY_HOST_HEADER } from '@zipper/utils';

/**
 * Just making this up for now, but this list will have to live somewhere
 * We should also prevent people from naming their app this list
 */
const NON_ALLOWED_SUBDOMAINS = ['www', 'app', 'zipper'];

/**
 * Gets the subdomain if it exists and is valid
 */
export default function getValidSubdomain(
  headers: Record<string, any>,
): string | void {
  const host = headers[ZIPPER_PREVIEW_PROXY_HOST_HEADER] || headers.host;

  const hostParts = host.split('.');

  // check to make sure the host has at least more than two parts
  // This way `zipper.run` or `localhost` without a subdomain won't work
  if (hostParts.length <= 2) return;

  const subdomain = hostParts[0];

  // Make sure it's a valid string and not in the blocklist
  if (!subdomain?.trim() || NON_ALLOWED_SUBDOMAINS.includes(subdomain)) return;

  return subdomain;
}
