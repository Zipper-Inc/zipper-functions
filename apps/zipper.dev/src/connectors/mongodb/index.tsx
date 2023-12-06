import createConnector from '../createConnector';
import { Box, Card, Heading, Text, VStack } from '@chakra-ui/react';

import { default as Connect } from './views/connect';
import { default as Disconnect } from './views/disconnect';

import { FiDatabase } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { code } from './constants';
import { useMemo } from 'react';

// configure the Postgres Connector
export const mongodbConnector = createConnector({
  id: 'mongodb',
  name: 'MongoDB',
  description: `Connect to a MongoDB database and run queries.`,
  icon: <FiDatabase />,
  code,
});

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

export const MongodbConnector = {
  Connect,
  Disconnect,
};

function MongoConnectorForm({ appId }: { appId: string }) {
  if (!mongodbConnector) {
    return null;
  }

  const existingSecret = trpc.secret.get.useQuery(
    {
      appId,
      key: ['MONGO_CONNECTION_STRING'],
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
        <Heading size="md">{mongodbConnector.name} Connector</Heading>
      </Box>
      <VStack align="start">
        <Card w="full">
          {existingInstallation ? (
            <MongodbConnector.Disconnect appId={appId} />
          ) : (
            <MongodbConnector.Connect appId={appId} />
          )}
        </Card>
      </VStack>
      <Text mt="10" color="fg.600">
        Connector code:
      </Text>
    </Box>
  );
}

export default MongoConnectorForm;
