import { GetServerSideProps } from 'next';
import { withDefaultTheme } from '@zipper/ui';
import { AppInfo, InputParams } from '@zipper/types';
import getAppInfo from '~/utils/get-app-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { VERSION_DELIMETER } from '~/utils/get-version-from-url';
import { Heading } from '@chakra-ui/react';
import Head from 'next/head';

export function AppPage({
  app,
  inputs,
}: {
  app: AppInfo;
  inputs: InputParams;
  version?: string;
}) {
  const appTitle = app.name || app.slug;
  return (
    <>
      <Head>
        <title>{appTitle}</title>
      </Head>
      <main>
        <Heading as="h2">{appTitle}</Heading>
        <h1></h1>
        {app.description && <p>{app.description}</p>}
        <code>{JSON.stringify(inputs, null, 2)}</code>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return { notFound: true };

  // validate version if it exists
  const versionFromUrl = query.version as string;
  if (versionFromUrl && !versionFromUrl.startsWith(VERSION_DELIMETER))
    return { notFound: true };

  // grab the app if it exists
  const result = await getAppInfo(subdomain);
  if (!result.ok) return { notFound: true };

  return { props: result.data };
};

export default withDefaultTheme(AppPage);
