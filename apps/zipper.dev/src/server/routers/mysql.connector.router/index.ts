import { createTRPCRouter } from '~/server/root';
import { default as deleteInstallation } from './routes/delete-installation';
import { default as get } from './routes/get';

export const mysqlConnectorRouter = createTRPCRouter({
  get,
  deleteInstallation,
});
