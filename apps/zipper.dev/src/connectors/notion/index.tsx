import { Box, Heading, VStack } from '@chakra-ui/react';
import { default as Connect } from './views/connect';
import { default as Disconnect } from './views/disconnect';
import { RxNotionLogo } from 'react-icons/rx';
import { trpc } from '~/utils/trpc';
import { useUser } from '~/hooks/use-user';
import { useMemo } from 'react';
import createConnector from '../createConnector';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const FILE_CODE = `import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts";

/**
 * ### This is an Notion API client intialized with the applet developer's Notion token
 * THIS CLIENT DOES NOT USE THE USER TOKEN!
 * All requests using this client will use the same token. Be careful if sharing publicly!
 */
const notion = new Client({
  auth: Deno.env.get("NOTION_BOT_TOKEN"),
});

export default notion;
`;

export const notionConnectorMetadata = createConnector({
  id: 'notion',
  name: 'Notion',
  description: "Use Notion's APIs to build interactive apps.",
  icon: <RxNotionLogo fill="black" />,
  code: FILE_CODE,
});

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

export const NotionConnector = {
  Connect,
  Disconnect,
};

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const NotionConnectorForm = ({ appId }: { appId: string }) => {
  /* ------------------- Hooks ------------------ */
  const { user } = useUser();

  /* ------------------ Queries ----------------- */
  const existingSecret = trpc.secret.get.useQuery(
    { appId, key: 'NOTION_BOT_TOKEN' },
    { enabled: !!user },
  );

  const connector = trpc.notionConnector.get.useQuery({
    appId,
  });

  /* ------------------- Memos ------------------ */
  const existingInstallation = useMemo(
    () => !!existingSecret.data || false,
    [existingSecret.data],
  );

  /* ------------------ Render ------------------ */
  return (
    <Box px="6" w="full">
      <Box mb="5">
        <Heading size="md">{notionConnectorMetadata.name} Connector</Heading>
      </Box>
      <VStack align="start">
        {existingInstallation &&
        (connector.data?.metadata as any)?.['bot_id'] !== undefined ? (
          <NotionConnector.Disconnect
            appId={appId}
            metadata={connector.data?.metadata as Record<string, any>}
          />
        ) : (
          <NotionConnector.Connect appId={appId} />
        )}
      </VStack>
    </Box>
  );
};

export default NotionConnectorForm;
