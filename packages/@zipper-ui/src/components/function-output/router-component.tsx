import { Box, Heading, Progress } from '@chakra-ui/react';
import { ZipperLocation } from '@zipper/types';
import { useEffectOnce } from '../../hooks/use-effect-once';
import { useState } from 'react';

export function RedirectComponent({ redirect }: Zipper.Router.Redirect) {
  const [loc, setLoc] = useState<ZipperLocation>();
  useEffectOnce(() => {
    setLoc(window.ZipperLocation);

    if (window.ZipperLocation === ZipperLocation.ZipperDotRun) {
      /** @todo handle internal URL's */
      window.location.href = redirect.toString();
    } else {
      window.open(redirect, 'BLANK');
    }
  });

  return (
    <>
      <Progress colorScheme="purple" size="xs" isIndeterminate width="full" />
      {loc === ZipperLocation.ZipperDotDev && (
        <Box pt={2}>Opening redirect in a new window</Box>
      )}
    </>
  );
}

export function NotFoundComponent() {
  return (
    <Box>
      <Heading>Not found</Heading>
    </Box>
  );
}

export function ErrorComponent({ error }: Zipper.Router.Error) {
  return (
    <Box>
      <Heading>Error</Heading>
      <Box>
        <code>{error}</code>
      </Box>
    </Box>
  );
}

export function RouterComponent({ route }: { route: any }) {
  if (route.error)
    return <ErrorComponent {...(route as Zipper.Router.Error)} />;
  if (route.redirect)
    return <RedirectComponent {...(route as Zipper.Router.Redirect)} />;
  return <NotFoundComponent />;
}
