import createConnector from './createConnector';
import {
  Box,
  Divider,
  FormLabel,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FiSlack } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';

export const slackConnector = createConnector({
  id: 'slack',
  name: 'Slack',
  icon: <FiSlack fill="black" />,
  code: `import { WebClient } from "https://deno.land/x/slack_web_api@6.7.2/mod.js";

const client = new WebClient(Deno.env.get('SLACK_TOKEN'));

export default client;
`,
});

function SlackConnectorForm({ appId }: { appId: string }) {
  const connectorForm = useForm();

  const botScopes = ['channels:read'];
  const existingSecrets = trpc.useQuery(['secret.all', { appId }]);
  const slackAuthURL = trpc.useQuery([
    'connector.slack.getAuthUrl',
    { appId, scopes: botScopes },
  ]);

  const tokenName = 'SLACK_TOKEN';

  return (
    <Box px="10" w="full">
      {slackConnector && (
        <FormProvider {...connectorForm}>
          <Box mb="5">
            <Heading size="md">{slackConnector.name}</Heading>
            <Text>Configure the {slackConnector.name} connector.</Text>
          </Box>
          <VStack align="start">
            <FormLabel>Slack Bot Authorization</FormLabel>
            {existingSecrets.data?.find((s) => s.key === tokenName) ? (
              <>
                <HStack></HStack>
              </>
            ) : (
              <>
                <HStack>
                  <a href={`${slackAuthURL.data?.url}`}>
                    <img
                      alt="Add to Slack"
                      height="40"
                      width="139"
                      src="https://platform.slack-edge.com/img/add_to_slack.png"
                      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                    />
                  </a>
                </HStack>
              </>
            )}
          </VStack>
          <Divider my={4} />
          Connector code:
        </FormProvider>
      )}
    </Box>
  );
}

export default SlackConnectorForm;
