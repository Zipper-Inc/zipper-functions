import createConnector from '../createConnector';
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
import { FormProvider, useForm } from 'react-hook-form';
import { FiTrash } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { VscGithub } from 'react-icons/vsc';
import { code } from './constants';
import Link from 'next/link';

export const githubConnector = createConnector({
  id: 'github',
  name: 'GitHub',
  icon: <VscGithub />,
  code,
});

function GitHubConnectorForm({ appId }: { appId: string }) {
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

  // get the Slack auth URL from the backend (it includes an encrypted state value that links
  // the auth request to the app)
  const githubAuthURL = trpc.useQuery([
    'githubConnector.getAuthUrl',
    {
      appId,
      scopes: ['repo', 'user'],
      postInstallationRedirect: window.location.href,
    },
  ]);

  const tokenName = 'GITHUB_TOKEN';

  const saveConnector = async (data: any) => {
    if (githubConnector) {
      if (data.token) {
        await addSecret.mutateAsync({
          appId,
          key: tokenName,
          value: data.token,
        });
      }
    }
  };

  return (
    <Box px="10" w="full">
      {githubConnector && (
        <FormProvider {...connectorForm}>
          <form onSubmit={connectorForm.handleSubmit(saveConnector)}>
            <Box mb="5">
              <Heading size="md">{githubConnector.name}</Heading>
              <Text>Configure the {githubConnector.name} connector.</Text>
            </Box>
            <VStack align="start">
              <FormControl
                border="1px solid"
                borderColor="gray.200"
                p="4"
                borderRadius="6"
              >
                <FormLabel>GitHub Personal Access Token</FormLabel>
                <Text fontSize="sm" mb="5">
                  Create a Personal Access Token at github.com/settings/tokens
                </Text>
                {existingSecrets.data?.find((s) => s.key === tokenName) ? (
                  <>
                    <HStack>
                      <Input value={tokenName} readOnly disabled />
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
                            key: tokenName || '',
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
                      <Input value={tokenName} readOnly disabled />
                      <Input
                        type="password"
                        {...connectorForm.register('token')}
                      />
                    </HStack>
                  </>
                )}
              </FormControl>
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
                {githubAuthURL.data?.url && (
                  <Link href={githubAuthURL.data?.url}>
                    {githubAuthURL.data?.url}
                  </Link>
                )}
              </Flex>
            </VStack>
          </form>
          <Divider my={4} />
          Connector code:
        </FormProvider>
      )}
    </Box>
  );
}

export default GitHubConnectorForm;
