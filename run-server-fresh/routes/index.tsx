import { PageProps, Handlers } from '$fresh/server.ts';
import { Head } from '$fresh/runtime.ts';
import { config } from 'dotenv';
import { AppInfoResult } from '../../src/types/app-info.ts';
import { Box } from '@chakra-ui/react';
import { withDefaultTheme } from '../hocs/with-chakra-provider.tsx';
import { AppInfo, InputParams } from '../../src/types/app-info.ts';
import InputParamsForm from '../islands/input-params-form.tsx';

export interface AppPageProps {
  app: AppInfo;
  version?: string;
  inputs?: InputParams;
  path?: string;
  children?: any;
}

const { NEXT_API_URL } = config({ path: '../.env' });

// versions are in the url, like app-slug.zipper.run/*@v1234
const VERSION_PATH_PREFIX = '/*@';

function getSubdomain({ host }: URL) {
  const hostParts = host.split('.');
  // this way localhost and the main domain don't count
  return hostParts.length >= 3 && hostParts[0] !== 'www' ? hostParts[0] : null;
}

function getVersionAndPath({ href, pathname, origin }: URL) {
  let version;
  let path = href.replace(origin, '');

  if (pathname.startsWith(VERSION_PATH_PREFIX)) {
    const parts = pathname.replace(VERSION_PATH_PREFIX, '').split('/');
    version = parts[0];
    path = path.replace(`${VERSION_PATH_PREFIX}${version}`, '');
  }

  return { version, path };
}

export const handler: Handlers<AppPageProps> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const subdomain = getSubdomain(url);
    if (!subdomain) return ctx.renderNotFound();

    const { version, path } = getVersionAndPath(url);

    const result = (await fetch(`${NEXT_API_URL}/app/info/${subdomain}`).then(
      (r) => r.json(),
    )) as AppInfoResult;

    if (!result.ok) return ctx.renderNotFound();

    return ctx.render({ ...result.data, version });
  },
};

function RunPage({ data }: PageProps<AppPageProps>) {
  const {
    app,
    version = app.lastDeploymentVersion || Date.now().toString(),
    inputs = [],
  } = data;
  const relayUrl = `/relay/${app.id}/${version}$4=`;
  return (
    <>
      <Head>
        <title>{app.name || app.slug}</title>
        {app.description && (
          <meta name="description" content={app.description} />
        )}
        <script type="text/javascript">
          window.Deno = {JSON.stringify(Deno)}
        </script>
      </Head>
      <InputParamsForm params={inputs} />
      <Box color="purple" p={16}>
        This is app {app.slug} at version {version}
      </Box>
      <iframe src={relayUrl} width="100%" height="500px" />
    </>
  );
}

export default withDefaultTheme(RunPage);
