import { Head } from '$fresh/runtime.ts';
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

function AppPage({
  app,
  version = app.lastDeploymentVersion || Date.now().toString(),
  children,
}: AppPageProps) {
  const relayUrl = `/relay/${app.id}/${version}$4=`;
  return (
    <>
      <Head>
        <title>{app.name || app.slug}</title>
        {app.description && (
          <meta name="description" content={app.description} />
        )}
      </Head>
      {children}
      <Box color="purple" p={16}>
        This is app {app.slug} at version {version}
      </Box>
      <iframe src={relayUrl} width="100%" height="500px" />
    </>
  );
}

export default withDefaultTheme(AppPage);
