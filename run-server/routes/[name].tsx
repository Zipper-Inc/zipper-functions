import { Head } from '$fresh/runtime.ts';
import { Box } from '@chakra-ui/react';
import { PageProps, Handlers } from '$fresh/server.ts';
import { withDefaultTheme } from '../hocs/with-chakra-provider.tsx';
import { config } from 'dotenv';

type App = {
  id: string;
  name: string;
  description: string;
  slug: string;
  lastDeploymentVersion: string;
};

type Inputs = any[];

interface AppInfo {
  app: App;
  inputs: Inputs;
}

type AppInfoResult =
  | {
      ok: true;
      data: AppInfo;
    }
  | {
      ok: false;
      error: string;
    };

const { NEXT_API_URL } = config({ path: '../.env' });

export const handler: Handlers<AppInfo> = {
  async GET(_req, ctx) {
    const [slug] = ctx.params.name.split('@');
    const result = (await fetch(`${NEXT_API_URL}/app/info/${slug}`).then((r) =>
      r.json(),
    )) as AppInfoResult;

    if (!result.ok) return ctx.renderNotFound();

    return ctx.render(result.data);
  },
};

function AppInstanceRunner(props: PageProps<AppInfo>) {
  const { app, inputs } = props.data;
  const [slug, versionFromUrl] = props.params.name.split('@');
  const version =
    versionFromUrl || app.lastDeploymentVersion || Date.now().toString();

  return (
    <>
      <Head>
        <title>{app.name}</title>
        <meta name="description" content={app.description} />
      </Head>
      <Box color="purple">
        This is app {slug} at version {version}
      </Box>
    </>
  );
}

export default withDefaultTheme(AppInstanceRunner);
