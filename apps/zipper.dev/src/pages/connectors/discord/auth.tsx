import { Center, Text, VStack } from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const SlackAuth: NextPageWithLayout = () => {
  const router = useRouter();
  const { code, state, error, error_description } = router.query;
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const exchangeMutation =
    trpc.discordConnector.exchangeCodeForToken.useMutation({
      onSuccess: (data) => {
        if (data.redirectTo?.includes('http')) {
          window.location.replace(data.redirectTo);
        } else {
          router.push(data.redirectTo || `/app/${data.appId}/src/main.ts`);
        }
      },
      onError: (error) => {
        setErrorMessage(error.message);
      },
    });

  if (error || errorMessage) {
    return (
      <Center w="100%" h="100vh">
        <VStack spacing="12">
          <ZipperLogo />
          <Text>{error_description || errorMessage}</Text>
        </VStack>
      </Center>
    );
  }

  if (!state) return <>Missing state</>;
  if (!code) return <>Missing code</>;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Slack has to redirect to an https url (usually ngrok)
      // so we have to redirect to localhost:3000 so that the cookie gets
      // set properly
      if (window.location.host !== 'localhost:3000') {
        router.push(`http://localhost:3000${router.asPath}`);
      } else {
        exchangeMutation.mutateAsync({
          code: code as string,
          state: state as string,
        });
      }
    } else {
      exchangeMutation.mutateAsync({
        code: code as string,
        state: state as string,
      });
    }
  }, []);

  //on the backend, exchange code for token and store it in the db for the unencoded state (app id)

  return (
    <Center w="100%" h="100vh">
      <VStack spacing="12">
        <ZipperLogo />
        <Text>
          Exchanging one-time code from Slack for an API token. Hold tight...
        </Text>
      </VStack>
    </Center>
  );
};

export default SlackAuth;

SlackAuth.header = () => <></>;
