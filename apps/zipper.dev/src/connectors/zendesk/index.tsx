import createConnector from '../createConnector';
import { Box, Heading, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { code, userScopes } from './constants';
import { SiZendesk } from 'react-icons/si';
import { trpc } from '~/utils/trpc';
import { useState } from 'react';
import { useRunAppContext } from '~/components/context/run-app-context';
import { useUser } from '~/hooks/use-user';
import {
  ConnectorUninstallForm,
  ConnectorInputForm,
  ConnectorInEditableForm,
} from './components';
import { UseQueryResult } from 'react-query';

export const zendeskConnector = createConnector({
  id: 'zendesk',
  name: 'Zendesk',
  icon: <SiZendesk />,
  code,
  userScopes,
});

const Secrets = {
  ZENDESK_TOKEN: 'ZENDESK_TOKEN',
  ZENDESK_EMAIL: 'ZENDESK_EMAIL',
  ZENDESK_SUBDOMAIN: 'ZENDESK_SUBDOMAIN',
  ZENDESK_APP_ID: 'ZENDESK_APP_ID',
  ZENDESK_JWT_SECRET: 'ZENDESK_JWT_SECRET',
};

/**
 * Returns a random alphanumeric string between minLength and
 * minLength + 10 charaters long
 * @param minLength {number}
 * @returns {string}
 */
function genRandomString(minLength: number) {
  // toString(36) converts the number to base 36 before stringifying,
  // so we get an alpha-numeric string between 0 and 11 chars
  let r = (Math.random() + 1).toString(36).substring(2);
  if (r.length < minLength) {
    r = `${r}${genRandomString(minLength - r.length)}`;
  }
  return r;
}

function ZendeskConnectorForm({ appId }: { appId: string }) {
  const { appInfo } = useRunAppContext();
  const { user } = useUser();
  const [zendeskSubdomain, setZendeskSubdomain] = useState<string>('');
  const [zendeskAppID, setZendeskAppID] = useState<string>('');
  const [zendeskEmail, setZendeskEmail] = useState<string>('');
  const [zendeskToken, setZendeskToken] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const addSecret = trpc.useMutation('secret.add');

  const existingSecrets: { [key: string]: UseQueryResult } = {};
  let existingInstalation = false;
  for (const secret in Secrets) {
    existingSecrets[secret] = trpc.useQuery(
      ['secret.get', { appId, key: secret }],
      { enabled: !!user },
    );
    if (existingSecrets[secret] && existingSecrets[secret]?.data)
      existingInstalation = true;
  }

  console.log('EXISTING SECRETS!');
  console.log(existingSecrets);

  const handleUninstall = async () => {
    setIsSaving(true);
    // TODO: do delete
    setIsSaving(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const jwtSecret = genRandomString(10);
    try {
      await Promise.all([
        addSecret.mutateAsync({
          appId,
          key: Secrets.ZENDESK_APP_ID,
          value: zendeskAppID,
        }),
        addSecret.mutateAsync({
          appId,
          key: Secrets.ZENDESK_SUBDOMAIN,
          value: zendeskSubdomain,
        }),
        addSecret.mutateAsync({
          appId,
          key: Secrets.ZENDESK_EMAIL,
          value: zendeskEmail,
        }),
        addSecret.mutateAsync({
          appId,
          key: Secrets.ZENDESK_TOKEN,
          value: zendeskToken,
        }),
        addSecret.mutateAsync({
          appId,
          key: Secrets.ZENDESK_JWT_SECRET,
          value: jwtSecret,
        }),
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box px="6" w="full">
      {zendeskConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{zendeskConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {appInfo.canUserEdit ? (
              <>
                {existingInstalation ? (
                  <ConnectorUninstallForm
                    handleUninstall={handleUninstall}
                    isSaving={isSaving}
                  />
                ) : (
                  <ConnectorInputForm
                    zendeskSubdomain={zendeskSubdomain}
                    zendeskAppID={zendeskAppID}
                    zendeskEmail={zendeskEmail}
                    zendeskToken={zendeskToken}
                    isSaving={isSaving}
                    setZendeskAppID={setZendeskAppID}
                    setZendeskSubdomain={setZendeskSubdomain}
                    setZendeskEmail={setZendeskEmail}
                    setZendeskToken={setZendeskToken}
                    handleSave={handleSave}
                  />
                )}
              </>
            ) : (
              <ConnectorInEditableForm />
            )}
          </VStack>
          <Text mt="10" color="fg.600">
            Connector code:
          </Text>
        </>
      )}
    </Box>
  );
}

export default ZendeskConnectorForm;
