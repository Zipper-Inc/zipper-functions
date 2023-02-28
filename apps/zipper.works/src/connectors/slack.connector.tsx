import createConnector from './createConnector';
import {
  Box,
  Card,
  CardBody,
  Code,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Spacer,
  StackDivider,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FiSlack } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { HiOutlineTrash } from 'react-icons/hi';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';

export const slackConnector = createConnector({
  id: 'slack',
  name: 'Slack',
  icon: <FiSlack fill="black" />,
  code: `import { WebClient } from "https://deno.land/x/slack_web_api@6.7.2/mod.js";

const client = new WebClient(Deno.env.get('SLACK_BOT_TOKEN'));

export default client;
`,
});
const scopes = {
  bot: [
    'app_mentions:read',
    'bookmarks:read',
    'bookmarks:write',
    'calls:read',
    'calls:write',
    'channels:history',
    'channels:join',
    'channels:manage',
    'channels:read',
    'chat:write',
    'chat:write.customize',
    'chat:write.public',
    'commands',
    'conversations.connect:manage',
    'conversations.connect:read',
    'conversations.connect:write',
    'dnd:read',
    'emoji:read',
    'files:read',
    'files:write',
    'groups:history',
    'groups:read',
    'groups:write',
    'im:history',
    'im:read',
    'im:write',
    'links.embed:write',
    'links:read',
    'links:write',
    'metadata.message:read',
    'mpim:history',
    'mpim:read',
    'mpim:write',
    'pins:read',
    'pins:write',
    'reactions:read',
    'reactions:write',
    'reminders:read',
    'reminders:write',
    'remote_files:read',
    'remote_files:share',
    'remote_files:write',
    'triggers:read',
    'team:read',
    'triggers:write',
    'usergroups:read',
    'usergroups:write',
    'users.profile:read',
    'users:read',
    'users:read.email',
    'users:write',
  ],
};

function SlackConnectorForm({ appId }: { appId: string }) {
  const connectorForm = useForm();
  const utils = trpc.useContext();
  const defaultBotScope = 'channels:read';
  const [botScopes, setBotScopes] = useState([defaultBotScope]);
  const botTokenName = 'SLACK_BOT_TOKEN';
  const existingSecrets = trpc.useQuery([
    'secret.get',
    { appId, key: botTokenName },
  ]);
  const connector = trpc.useQuery(['connector.slack.get', { appId }]);
  const slackAuthURL = trpc.useQuery([
    'connector.slack.getAuthUrl',
    { appId, scopes: botScopes, redirectTo: window.location.href },
  ]);

  useEffect(() => {
    slackAuthURL.refetch();
  }, [botScopes]);

  const deleteConnectorMutation = trpc.useMutation('connector.slack.delete', {
    async onSuccess() {
      await utils.invalidateQueries(['connector.slack.get', { appId }]);
      await utils.invalidateQueries([
        'secret.get',
        { appId, key: botTokenName },
      ]);
    },
  });

  const __options = scopes.bot.map((scope) => ({ label: scope, value: scope }));

  const { value, options, onChange } = useMultiSelect({
    options: __options!,
    value: [defaultBotScope],
  });

  useEffect(() => {
    setBotScopes(value as string[]);
  }, [value]);

  if (existingSecrets.isLoading || connector.isLoading) {
    return <></>;
  }

  return (
    <Box px="10" w="full">
      {slackConnector && (
        <FormProvider {...connectorForm}>
          <Box mb="5">
            <Heading size="md">{slackConnector.name}</Heading>
            <Text>Configure the {slackConnector.name} connector.</Text>
          </Box>
          <VStack align="start">
            {!existingSecrets.data && (
              <FormLabel>Slack Bot Authorization</FormLabel>
            )}

            {existingSecrets.data && connector.data?.metadata ? (
              <Card w="full">
                <CardBody color="gray.600">
                  <HStack>
                    <Heading size="sm" mb="4">
                      Current installation
                    </Heading>
                    <Spacer />
                    {slackAuthURL.data && (
                      <IconButton
                        aria-label="Delete connector"
                        variant="ghost"
                        onClick={() => {
                          deleteConnectorMutation.mutateAsync({
                            appId,
                          });
                        }}
                        icon={<Icon as={HiOutlineTrash} color="gray.400" />}
                      />
                    )}
                  </HStack>
                  <VStack
                    align="start"
                    divider={<StackDivider />}
                    fontSize="sm"
                  >
                    <HStack>
                      <Text>Installed to:</Text>
                      <Code>
                        {(connector.data?.metadata as any)['team']['name']}
                      </Code>
                    </HStack>
                    <HStack>
                      <Text>Bot User ID:</Text>
                      <Code>
                        {(connector.data?.metadata as any)['bot_user_id']}
                      </Code>
                    </HStack>
                    <HStack>
                      <Text>Scopes:</Text>
                      <Code>{(connector.data?.metadata as any)['scope']}</Code>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <VStack align="start" w="full">
                <FormControl>
                  <FormLabel>Scopes</FormLabel>
                  <MultiSelect
                    options={options}
                    value={value}
                    onChange={onChange as SelectOnChange}
                  />
                </FormControl>
                {slackAuthURL.data ? (
                  <Link href={slackAuthURL.data?.url}>
                    <img
                      alt="Add to Slack"
                      height="40"
                      width="139"
                      src="https://platform.slack-edge.com/img/add_to_slack.png"
                      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                    />
                  </Link>
                ) : (
                  <img
                    alt="Add to Slack"
                    height="40"
                    width="139"
                    src="https://platform.slack-edge.com/img/add_to_slack.png"
                    srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                  />
                )}
              </VStack>
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
