import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { loadEnvConfig } from '@next/env';
import { getZipperDotDevUrlForServer } from './server/utils/server-url.utils';

loadEnvConfig('./../../', process.env.NODE_ENV !== 'production');

const dev = process.env.NODE_ENV !== 'production';
const [hostname, portString] =
  process.env.NEXT_PUBLIC_ZUPPER_DOT_DEV_HOST?.split(':') || [];
const port = parseInt(process.env.PORT || portString || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Load environment variables from .env, .env.local, etc. This explicit call
// into `@next/env` allows using environment variables before next() is called.
// More info: https://nextjs.org/docs/basic-features/environment-variables

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at ${getZipperDotDevUrlForServer()} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`,
  );

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeQueuesAndWorkers } = require('./server/queue');
  initializeQueuesAndWorkers();
});
