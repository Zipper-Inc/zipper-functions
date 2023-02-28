import { Center, Text, VStack } from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const SlackAuth: NextPageWithLayout = () => {
  const router = useRouter();
  const { code, state } = router.query;

  const exchangeMutation = trpc.useMutation(
    'connector.slack.exchangeCodeForToken',
    {
      onSuccess: (data) =>
        router.push(data.redirectTo || `/app/${data.appId}/edit/main.ts`),
    },
  );

  if (!state) return <>Missing state</>;
  if (!code) return <>Missing code</>;

  useEffect(() => {
    exchangeMutation.mutateAsync({
      code: code as string,
      state: state as string,
    });
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
