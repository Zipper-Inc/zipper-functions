import { Box, Heading, Progress } from '@chakra-ui/react';
import { useEffect } from 'react';

export function RedirectComponent({ redirect }: Zipper.Router.Redirect) {
  useEffect(() => {
    window.location.href = redirect.toString();
  }, []);

  return (
    <Progress
      colorScheme="purple"
      size="xs"
      isIndeterminate
      width="full"
      position="absolute"
      left={0}
      right={0}
      bottom={0}
    />
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
