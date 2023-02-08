import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const EditPage: NextPageWithLayout = () => {
  const router = useRouter();

  const resourceOwnerSlug = router.query['resource-owner'] as string;
  const appSlug = router.query['app-slug'] as string;

  const appQuery = trpc.useQuery([
    'app.byResourceOwnerAndAppSlugs',
    { resourceOwnerSlug, appSlug },
  ]);

  useEffect(() => {
    if (appQuery.data) {
      router.replace(
        `/${resourceOwnerSlug}/${appSlug}/edit/${appQuery.data.scriptMain?.script.filename}`,
      );
    }
  }, [appQuery.data]);

  return <></>;
};

EditPage.skipAuth = true;

export default EditPage;
