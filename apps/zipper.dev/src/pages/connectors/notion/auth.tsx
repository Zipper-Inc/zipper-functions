import { Center, Text, VStack } from '@chakra-ui/react';
import { ZipperLogo } from '@zipper/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

const NotionRedirect = () => {
  /* ------------------ States ------------------ */
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  /* ------------------- Hooks ------------------ */
  const router = useRouter();
  const { code, state, error, error_description } = router.query;

  /* ----------------- Mutation ----------------- */
  const exchangeMutation =
    trpc.notionConnector.exchangeCodeForToken.useMutation({
      onSuccess: (data) => {
        router.push(data?.redirectTo as string);
      },
      onError: (error) => {
        setErrorMessage(error.message);
      },
    });

  /* --------------- Render Errors -------------- */
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

  if (!code) return <>Missing code</>;

  /* ------------------ Effects ----------------- */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      /**
       * Discord has to redirect to an https url (usually ngrok)
       * so we have to redirect to localhost:3000 so that the cookie gets
       * set properly
       */
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

  /* ------------------ Render ------------------ */
  return (
    <Center w="100%" h="100vh">
      <VStack spacing="12">
        <ZipperLogo />
        <Text>
          Exchanging one-time code from Discord for an API token. Hold tight...
        </Text>
      </VStack>
    </Center>
  );
};

export default NotionRedirect;
