import { createTRPCRouter } from '~/server/root';
import { default as getAuthUrl } from './routes/get-auth-url';
import { default as deleteInstallation } from './routes/delete-installation';
import { default as get } from './routes/get';
import { default as exchangeCodeForToken } from './routes/exchange-code-token';

export const notionConnectorRouter = createTRPCRouter({
  get,
  getAuthUrl,
  deleteInstallation,
  exchangeCodeForToken,
});
