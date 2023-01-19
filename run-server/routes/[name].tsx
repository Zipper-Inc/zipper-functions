import { Head } from '$fresh/runtime.ts';
import { Box } from '@chakra-ui/react';
import { PageProps, Handlers } from '$fresh/server.ts';
import { withDefaultTheme } from '../hocs/with-chakra-provider.tsx';
import { config } from 'dotenv';
import {
  AppInfoAndInputParams,
  AppInfoResult,
} from '../../src/types/app-info.ts';

const { NEXT_API_URL } = config({ path: '../.env' });

export const handler: Handlers<AppInfoAndInputParams> = {
  async GET(_req, ctx) {
    const [slug] = ctx.params.name.split('@');
    const result = (await fetch(`${NEXT_API_URL}/app/info/${slug}`).then((r) =>
      r.json(),
    )) as AppInfoResult;

    if (!result.ok) return ctx.renderNotFound();

    return ctx.render(result.data);
  },
};

function AppInstanceRunner(props: PageProps<AppInfoAndInputParams>) {
  const { app, inputs } = props.data;
  const [slug, versionFromUrl] = props.params.name.split('@');
  const version =
    versionFromUrl || app.lastDeploymentVersion || Date.now().toString();

  return (
    <>
      <Head>
        <title>{app.name || app.slug}</title>
        {app.description && (
          <meta name="description" content={app.description} />
        )}
      </Head>
      <Box backgroundColor="gray.100" p={16}>
        {inputs.map((i) => (
          <p>
            <code>{JSON.stringify(i)}</code>
          </p>
        ))}
      </Box>
      <Box color="purple" p={16}>
        This is app {slug} at version {version}
      </Box>
    </>
  );
}

export default withDefaultTheme(AppInstanceRunner);
