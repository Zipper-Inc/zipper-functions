import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { trpc } from '~/utils/trpc';

export default function SlackAuth() {
  const router = useRouter();
  const { code, state } = router.query;

  const exchangeMutation = trpc.useMutation(
    'connector.slack.exchangeCodeForToken',
    { onSuccess: (data) => router.push(`/app/${data.appId}/edit/main.ts`) },
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

  return <>Chatting to Slack... Hold tight</>;
}
