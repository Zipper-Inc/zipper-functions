import createConnector from '../createConnector';
import { Box, Card, Heading, Text, VStack } from '@chakra-ui/react';

import { default as Connect } from './views/connect';
import { default as Disconnect } from './views/disconnect';

import { FiDatabase } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { code } from './constants';
import { useMemo } from 'react';

// configure the Postgres Connector
export const postgresConnector = createConnector({
  id: 'postgres',
  name: 'Postgres',
  description: 'Connect to a Postgres database and run queries.',
  icon: <FiDatabase />,
  code,
});

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

export const PostgresConnector = {
  Connect,
  Disconnect,
};

function PostgresConnectorForm({ appId }: { appId: string }) {
  if (!postgresConnector) {
    return null;
  }

  const existingSecret = trpc.secret.get.useQuery(
    {
      appId,
      key: ['POSTGRES_CONNECTION_STRING'],
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
        <Heading size="md">{postgresConnector.name} Connector</Heading>
      </Box>
      <VStack align="start">
        <Card w="full">
          {existingInstallation ? (
            <PostgresConnector.Disconnect appId={appId} />
          ) : (
            <PostgresConnector.Connect appId={appId} />
          )}
        </Card>
      </VStack>
      <Text mt="10" color="fg.600">
        Connector code:
      </Text>
    </Box>
  );
}

export default PostgresConnectorForm;
