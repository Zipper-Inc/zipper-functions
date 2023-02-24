import { useRouter } from 'next/router';

export default function SlackAuth() {
  const router = useRouter();
  const { code, state } = router.query;

  if (!state) return <>Missing state</>;
  if (!code) return <>Missing code</>;

  //on the backend, exchange code for token and store it in the db for the unencoded state (app id)

  return <>{code}</>;
}
