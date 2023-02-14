/**
 * Just making this up for now, but this list will have to live somewhere
 * We should also prevent people from naming their app this list
 */
const NON_ALLOWED_SUBDOMAINS = ['www', 'app', 'zipper'];

/**
 * Gets the subdomain if it exists and is valid
 */
export function getValidSubdomain(host = ''): string | void {
  const hostParts = host.split('.');

  // check to make sure the host has at least more than two parts
  // This way `zipper.run` or `localhost` without a subdomain won't work
  if (hostParts.length <= 2) return;

  const subdomain = hostParts[0];

  // Make sure it's a valid string and not in the blocklist
  if (!subdomain?.trim() || NON_ALLOWED_SUBDOMAINS.includes(subdomain)) return;

  return subdomain;
}

export function removeSubdomains(host: string) {
  const parts = host.split('.');
  return parts.slice(parts.length - 2).join('.');
}
