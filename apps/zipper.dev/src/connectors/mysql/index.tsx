import createConnector from '../createConnector';
import { Box, Card, Heading, Text, VStack } from '@chakra-ui/react';

import { default as Connect } from './views/connect';
import { default as Disconnect } from './views/disconnect';

import { FiDatabase } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { code } from './constants';
import { useMemo } from 'react';

// configure the Postgres Connector
export const mysqlConnector = createConnector({
  id: 'mysql',
  name: 'Mysql',
  description: 'Connect to a Mysql database and run queries.',
  icon: <FiDatabase />,
  code,
});

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

export const MysqlConnector = {
  Connect,
  Disconnect,
};

function MysqlConnectorForm({ appId }: { appId: string }) {
  if (!mysqlConnector) {
    return null;
  }

  const existingSecret = trpc.secret.get.useQuery(
    {
      appId,
      key: ['MYSQL_HOSTNAME', 'MYSQL_USERNAME', 'MYSQL_DB', 'MYSQL_PASSWORD'],
    },
    { enabled: !!appId },
  );

  /* ------------------- Memos ------------------ */
  const existingInstallation = useMemo(
    () => !!existingSecret.data || false,
    [existingSecret.data],
  );

  return (
    <Box px="6" w="full">
      <Box mb="5">
        <Heading size="md">{mysqlConnector.name} Connector</Heading>
      </Box>
      <VStack align="start">
        <Card w="full">
          {existingInstallation ? (
            <MysqlConnector.Disconnect appId={appId} />
          ) : (
            <MysqlConnector.Connect appId={appId} />
          )}
        </Card>
      </VStack>
      <Text mt="10" color="fg.600">
        Connector code:
      </Text>
    </Box>
  );
}

export default MysqlConnectorForm;
