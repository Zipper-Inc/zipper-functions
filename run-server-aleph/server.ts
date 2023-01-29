import { serve } from 'aleph/react-server';
import routes from './routes/_export.ts';

serve({
  router: { routes },
  port: 8001,
  ssr: true,
});
