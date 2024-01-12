import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import FoundersNote from '~/components/founders-note';
import { trpc } from '~/utils/trpc';
import { NextPageWithLayout } from '../_app';

const Welcome: NextPageWithLayout = () => {
  const router = useRouter();
  const session = useSession();
  const { callbackUrl } = router.query;
  const cb = callbackUrl
    ? `${encodeURIComponent(String(callbackUrl))}`
    : '/dashboard';

  const setSettingMutation = trpc.user.setSettingValue.useMutation({
    onSuccess: () => {
      session.update({ updateProfile: true });
    },
  });

  useEffect(() => {
    setSettingMutation.mutateAsync({
      settingName: 'showWelcomeMessage',
      settingValue: 'false',
    });
  }, []);

  return <FoundersNote callbackUrl={cb} />;
};

export default Welcome;

Welcome.header = () => <></>;
