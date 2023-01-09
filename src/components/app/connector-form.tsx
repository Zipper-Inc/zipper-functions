import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FiTrash } from 'react-icons/fi';
import { Connector, connectors } from '~/config/connectors';
import { trpc } from '~/utils/trpc';

export function ConnectorForm({
  type,
  appId,
}: {
  type: string;
  appId: string;
}) {
  const [connector, setConnector] = useState<Connector>();
  const connectorForm = useForm();

  const utils = trpc.useContext();
  const existingSecrets = trpc.useQuery(['secret.all', { appId }]);

  const addSecret = trpc.useMutation('secret.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['secret.all', { appId }]);
    },
  });

  const deleteSecret = trpc.useMutation('secret.delete', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['secret.all', { appId }]);
    },
  });

  const saveConnector = async (data: any) => {
    if (connector) {
      if (data.token) {
        await addSecret.mutateAsync({
          appId,
          key: connector.schema.token?.envVar || '',
          value: data.token,
        });
      }
    }
  };

  useEffect(() => {
    setConnector(connectors.find((c) => c.id === type));
  }, [type]);
  return (
    <Box px="10" w="full">
      {connector && (
        <FormProvider {...connectorForm}>
          <form onSubmit={connectorForm.handleSubmit(saveConnector)}>
            <Box mb="5">
              <Heading size="md">{connector.name}</Heading>
              <Text>Configure the {connector.name} connector.</Text>
            </Box>
            <VStack align="start">
              {connector.schema.token && (
                <FormControl
                  border="1px solid"
                  borderColor="gray.200"
                  p="4"
                  borderRadius="6"
                >
                  <FormLabel>{connector.schema.token.name}</FormLabel>
                  <Text fontSize="sm" mb="5">
                    {connector.schema.token.description}
                  </Text>
                  {existingSecrets.data?.find(
                    (s) => s.key === connector.schema.token?.envVar,
                  ) ? (
                    <>
                      <HStack>
                        <Input
                          value={connector.schema.token.envVar}
                          readOnly
                          disabled
                        />
                        <Input
                          type="password"
                          value="********"
                          readOnly
                          disabled
                        />

                        <IconButton
                          variant="ghost"
                          colorScheme="red"
                          aria-label="delete"
                          onClick={async () => {
                            await deleteSecret.mutateAsync({
                              appId,
                              key: connector.schema.token?.envVar || '',
                            });
                            connectorForm.reset();
                          }}
                        >
                          <FiTrash />
                        </IconButton>
                      </HStack>
                    </>
                  ) : (
                    <>
                      <HStack>
                        <Input
                          value={connector.schema.token.envVar}
                          readOnly
                          disabled
                        />
                        <Input
                          type="password"
                          {...connectorForm.register('token')}
                        />
                      </HStack>
                    </>
                  )}
                </FormControl>
              )}
              {/* {connector.schema.clientId ?? ()}
            {connector.schema.clientSecret ?? ()}
            {connector.schema.scopes ?? ()} */}
              <Flex w="full">
                <Spacer />
                <Box>
                  <Button colorScheme={'purple'} type="submit" ml="auto">
                    Submit
                  </Button>
                </Box>
              </Flex>
            </VStack>
          </form>
          <Divider my={4} />
          Connector code:
          <Text
            w="full"
            whiteSpace={'pre'}
            borderRadius="10"
            mt={4}
            px={4}
            fontFamily="mono"
            fontSize="xs"
            backgroundColor="gray.100"
          >
            {connector.code}
          </Text>
        </FormProvider>
      )}
    </Box>
  );
}
