import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';

const EditPage: NextPageWithLayout = () => {
  const router = useRouter();
  const resourceOwnerSlug = router.query['resource-owner'] as string;
  const appSlug = router.query['app-slug'] as string;

  useEffect(() => {
    router.replace(`/${resourceOwnerSlug}/${appSlug}/src/main.ts`);
  }, []);

  return <></>;
};

EditPage.skipAuth = true;

export default EditPage;
