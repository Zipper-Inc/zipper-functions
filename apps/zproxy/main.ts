/**
 * @module zproxy
 * Zipper internal preview proxy
 * Will be running on those domains you can be run on dev
 *
 * The proxy works like this:
 *
 * REQUEST HOST => PROXIED HOST
 *
 * zpr.dev => localhost:3000
 * local.zpr.dev => localhost:3000
 * localdev.me:3001 => localhost:3000
 *
 * zpr.run => localhost:3002
 * [applet].zpr.run => localhost:3002
 * [applet].local.zpr.run => localhost:3002
 * localdev.me:3003 => localhost:3002
 *
 * pr-421.zpr.dev => zipper-dev-preview-pr-421.onrender.com
 * pr-421.localdev.me:3001 => zipper-dev-preview-pr-421.onrender.com
 *
 * pr-421.zpr.run => zipper-run-preview-pr-421.onrender.com
 * [applet].pr-421.zpr.run => zipper-run-preview-pr-421.onrender.com
 * pr-421.localdev.me:3003 => zipper-run-preview-pr-421.onrender.com
 *
 * fwd.zpr.run => zipper-inc-internal-forwarder.zipper.run
 * fwd.localdev.me:3003 => zipper-inc-internal-forwarder.zipper.run
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

function getProxiedHost(env: Env, tld: TopLevelDomain): string {
  switch (env) {
    case 'local':
      return `localhost:${LOCAL_PORTS[tld]}`;
    case 'preview':
      return `zipper-${tld}-preview.onrender.com`;
    case 'prod':
      return `zipper.${tld}`;
    case 'fwd':
      return 'zipper-inc-internal-forwarder.zipper.run';
    default: {
      if (env.startsWith('pr-')) {
        return `zipper-${tld}-preview-${env}.onrender.com`;
      }
      return getProxiedHost('preview', tld);
    }
  }
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

  return proxy(getProxiedHost(env as Env, tld as TopLevelDomain), {
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
