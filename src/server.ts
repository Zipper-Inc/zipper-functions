import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { loadEnvConfig } from '@next/env';

loadEnvConfig('./', process.env.NODE_ENV !== 'production');
import { initializeQueuesAndWorkers } from './server/queue';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
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
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`,
  );

  initializeQueuesAndWorkers();
});
