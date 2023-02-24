import createConnector from './createConnector';
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
import { FiSlack, FiTrash } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';

const connector = createConnector({
  id: 'slack',
  name: 'Slack',
  icon: <FiSlack fill="black" />,
  code: `//some slack related code will go here
`,
});

function ConnectorForm(appId: string) {
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

  const tokenName = 'SLACK_TOKEN';

  const saveConnector = async (data: any) => {
    if (connector) {
      if (data.token) {
        await addSecret.mutateAsync({
          appId,
          key: tokenName,
          value: data.token,
        });
      }
    }
  };

  const botScopes = ['channels:read'];

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
              <FormLabel>Slack Bot Authorization</FormLabel>
              <Text fontSize="sm" mb="5">
                Create a Personal Access Token at github.com/settings/tokens
              </Text>
              {existingSecrets.data?.find((s) => s.key === tokenName) ? (
                <>
                  <HStack></HStack>
                </>
              ) : (
                <>
                  <HStack>
                    <a
                      href={`https://slack.com/oauth/v2/authorize?client_id=1306956569105.4837206910023&scope=${botScopes.join(
                        ',',
                      )}&user_scope=`}
                    >
                      <img
                        alt="Add to Slack"
                        height="40"
                        width="139"
                        src="https://platform.slack-edge.com/img/add_to_slack.png"
                        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                      />
                      Add to Slack
                    </a>
                  </HStack>
                </>
              )}
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
        </FormProvider>
      )}
    </Box>
  );
}

export default { ...connector, render: ConnectorForm };
