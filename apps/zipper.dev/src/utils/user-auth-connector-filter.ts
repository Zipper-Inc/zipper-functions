import { AppConnector } from '@prisma/client';

export const requiredUserAuthConnectorFilter = (
  connector: Pick<AppConnector, 'userScopes' | 'isUserAuthRequired'>,
) => connector.isUserAuthRequired;
