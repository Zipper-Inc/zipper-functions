/**
 * @module zproxy
 * Zipper internal preview proxy
 * Will be running on those domains you can be run on dev
 *
 * URLs work like this:
 *
 *  REQUEST URL => PROXIED URL
 *
 *  https://zpr.dev => http://localhost:3000
 *  https://local.zpr.dev => http://localhost:3000
 *  http://localdev.me:3001=> http://localhost:3000
 *
 *  https://zpr.run => http://localhost:3002
 *  https://*.zpr.run => http://localhost:3002
 *  https://*.local.zpr.run => http://localhost:3002
 *  http://localdev.me:3003 => http://localhost:3002
 *
 *  https://pr-421.zpr.dev => https://zipper-dev-preview-pr-421.onrender.com
 *  http://pr-421.localdev.me:3001 => https://zipper-dev-preview-pr-421.onrender.com
 *
 *  https://pr-421.zpr.run => https://zipper-run-preview-pr-421.onrender.com
 *  https://*.pr-421.zpr.run => https://zipper-run-preview-pr-421.onrender.com
 *  http://pr-421.localdev.me:3003 => https://zipper-run-preview-pr-421.onrender.com
 *
 *  https://fwd.zpr.dev => https://zipper-inc-internal-forwarder.zipper.run
 *  https://fwd.zpr.run => https://zipper-inc-internal-forwarder.zipper.run
 *  https://fwd.localdev.me:3001 => https://zipper-inc-internal-forwarder.zipper.run
 *  https://fwd.localdev.me:3003 => https://zipper-inc-internal-forwarder.zipper.run
 */

import proxy from 'express-http-proxy';
import express from 'express';
import minimist from 'minimist-lite';

type Env = 'local' | `pr-${number}` | 'preview' | 'prod' | 'fwd';
enum TopLevelDomain {
  Dev = 'dev',
  Run = 'run',
}

const DEFAULT_PORT = 9999;
const LOCAL_PORTS = {
  [TopLevelDomain.Dev]: 3000,
  [TopLevelDomain.Run]: 3002,
};

const argv: { tld: TopLevelDomain } = minimist(process.argv.slice(2));

export const ZIPPER_PREVIEW_PROXY_HOST_HEADER = 'x-preview-proxy-host';

const looksLikeAnEnv = (part: string) =>
  /^(local|pr-\d+|preview|prod|fwd)$/.test(part);

function getProxiedUrl(env: Env, tld: TopLevelDomain) {
  if (env === 'local' && tld === 'dev')
    return `http://localhost:${LOCAL_PORTS.dev}`;
  if (env === 'local' && tld === 'run')
    return `http://localhost:${LOCAL_PORTS.run}`;

  if (env.startsWith('pr-'))
    return `https://zipper-${tld}-preview-${env}.onrender.com`;

  if (env === 'preview') return `https://zipper-${tld}-preview.onrender.com`;

  if (env === 'prod') return `https://zipper.${tld}`;

  return 'https://zipper-inc-internal-forwarder.zipper.run';
}

const app = express();

app.use((req, res, next) => {
  // i.e. localdev.me
  // or   applet-name.zipper-run-preview.localdev.me
  const hostnameParts = req.hostname.split('.');

  if (hostnameParts.length < 2) return res.send('🤷🏽‍♂️ Not sure what to proxy');

  // Remove the last two parts of the hostname
  // i.e. ['zpr, 'dev']
  const [, lastPartOfDomain] = hostnameParts.splice(-2);

  const tld: TopLevelDomain = argv.tld || lastPartOfDomain;
  const [closestSubdomain] = hostnameParts.splice(-1);
  const env = looksLikeAnEnv(closestSubdomain) ? closestSubdomain : 'local';
  req.headers[ZIPPER_PREVIEW_PROXY_HOST_HEADER] = req.hostname;

  return proxy(getProxiedUrl(env as Env, tld as TopLevelDomain), {
    memoizeHost: false,
    userResHeaderDecorator: (headers) => ({
      [ZIPPER_PREVIEW_PROXY_HOST_HEADER]: req.hostname,
      ...headers,
    }),
  })(req, res, next);
});

const port = argv.tld ? LOCAL_PORTS[argv.tld] + 1 : DEFAULT_PORT;
app.listen(port, () => {
  console.log(`🥽 Started the preview proxy on ${port}`);
});
