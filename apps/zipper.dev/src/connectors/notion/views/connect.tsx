import {
  Button,
  Card,
  CardBody,
  Code,
  Collapse,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Spacer,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { trpc } from '~/utils/trpc';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const CLIENT_ID_FORM = {
  LABEL: `Custom client ID?`,
  DESCRIPTION:
    'When checked, you can specify your own Notion client ID and secret.',
  REDIRECT_URL:
    process.env.NODE_ENV === 'development'
      ? 'https://redirectmeto.com/http://localhost:3000/connectors/notion/auth'
      : 'https://zipper.dev/connectors/notion/auth',
};

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const NotionConnect: React.FC<{ appId: string }> = ({ appId }) => {
  /* ------------------ States ------------------ */
  const [isOwnClientIdRequired, setIsOwnClientIdRequired] = useState(false);
  const [client, setClient] = useState({ secret: '', id: '' });
  const [isSubmiting, setIsSubmiting] = useState<null | string>(null);

  /* ------------------- Hooks ------------------ */
  const context = trpc.useContext();
  const router = useRouter();

  /* ------------------ Queries ----------------- */
  const authURL = trpc.notionConnector.getAuthUrl.useQuery({
    appId,
    postInstallationRedirect: window.location.href,
  });

  /* ----------------- Mutations ---------------- */
  const addSecretMutation = trpc.secret.add.useMutation();

  const updateAppConnectorMutation = trpc.appConnector.update.useMutation({
    onSuccess: () => {
      context.app.byResourceOwnerAndAppSlugs.invalidate({
        appSlug: router.query['app-slug'] as string,
        resourceOwnerSlug: router.query['resource-owner'] as string,
      });
    },
  });

  /* ----------------- Callbacks ---------------- */
  async function onConnectClientOwnClientId() {
    setIsSubmiting('Saving');

    await Promise.all([
      addSecretMutation.mutateAsync({
        appId,
        key: 'NOTION_CLIENT_SECRET',
        value: client.secret,
      }),
      updateAppConnectorMutation.mutateAsync({
        appId,
        type: 'notion',
        data: { isUserAuthRequired: false, clientId: client.id },
      }),
    ]);

    setIsSubmiting('Redirecting');

    router.push(authURL.data?.href as string);

    return setIsSubmiting(null);
  }

  /* ------------------ Render ------------------ */
  return (
    <Card w="full">
      <CardBody color="fg.600">
        <VStack as="form" align="start" w="full" overflow="visible">
          <Heading size="sm">Configuration</Heading>
          <HStack pt="4" pb="4" w="full">
            <FormControl>
              <HStack w="full">
                <FormLabel>{CLIENT_ID_FORM.LABEL}</FormLabel>
                <Spacer flexGrow={1} />
                <Switch
                  isChecked={isOwnClientIdRequired}
                  ml="auto"
                  onChange={(e) => setIsOwnClientIdRequired(e.target.checked)}
                />
              </HStack>
              <FormHelperText maxW="xl" mb="2">
                {CLIENT_ID_FORM.DESCRIPTION}
              </FormHelperText>

              <Collapse in={isOwnClientIdRequired} animateOpacity>
                <FormControl>
                  <FormLabel color={'fg.500'}>Client ID</FormLabel>
                  <Input
                    autoComplete="new-password"
                    value={client.id}
                    onChange={(e) =>
                      setClient({ ...client, id: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl pt="2">
                  <FormLabel color={'fg.500'}>Client Secret</FormLabel>

                  <Input
                    autoComplete="new-password"
                    type="password"
                    value={client.secret}
                    onChange={(e) =>
                      setClient({ ...client, secret: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl pt="2">
                  <FormLabel>Redirect URL</FormLabel>
                  <Text>
                    Set your Notion app's redirect URL to:{' '}
                    <Code>{CLIENT_ID_FORM.REDIRECT_URL}</Code>
                  </Text>
                </FormControl>
              </Collapse>
            </FormControl>
          </HStack>
          <Button
            mt="6"
            colorScheme="purple"
            isLoading={!!isSubmiting}
            loadingText={isSubmiting!}
            onClick={onConnectClientOwnClientId}
          >
            Save & Install
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default NotionConnect;
