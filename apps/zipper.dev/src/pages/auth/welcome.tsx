import { useRouter } from 'next/router';
import FoundersNote from '~/components/founders-note';
import { NextPageWithLayout } from '../_app';

const Welcome: NextPageWithLayout = () => {
  const router = useRouter();
  const { callbackUrl } = router.query;
  const cb = callbackUrl
    ? `${encodeURIComponent(String(callbackUrl))}`
    : `/dashboard`;

  return <FoundersNote callbackUrl={cb} />;
};

export default Welcome;

Welcome.header = () => <></>;
