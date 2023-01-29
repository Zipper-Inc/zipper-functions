import { Box } from '@chakra-ui/react';
import { withDefaultTheme } from '../hocs/with-chakra-provider.tsx';
import { AppInfo } from '../types/app-info.ts';
import InputParamsForm from './input-params-form.tsx';

export interface AppPageProps {
  app: AppInfo;
  version?: string;
  inputs?: any;
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
      {children}
      <Box color="purple" p={16}>
        This is app {app.slug} at version {version}
      </Box>
      <InputParamsForm params={[]} />
      <iframe src={relayUrl} width="100%" height="500px" />
    </>
  );
}

export default withDefaultTheme(AppPage);
