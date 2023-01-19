import { Head } from '$fresh/runtime.ts';
import { Box } from '@chakra-ui/react';
import { PageProps, Handlers } from '$fresh/server.ts';
import { withDefaultTheme } from '../hocs/with-chakra-provider.tsx';

type AppInstance = {
  name: string;
};

export const handler: Handlers<AppInstance> = {
  async GET(_req, ctx) {
    const app = await Promise.resolve({ name: 'Test App Instance' });
    return ctx.render(app);
  },
};

function AppInstanceRunner(props: PageProps<AppInstance>) {
  return (
    <>
      <Head>
        <title>{props.data.name}</title>
      </Head>
      <Box color="purple">Hello {props.params.name}</Box>
    </>
  );
}

export default withDefaultTheme(AppInstanceRunner);
