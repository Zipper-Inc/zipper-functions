import { Head } from '$fresh/runtime.ts';
import { Box, Heading, Divider, HStack } from '@chakra-ui/react';
import { withDefaultTheme } from '../hocs/with-chakra-provider.tsx';

function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Not found</title>
      </Head>
      <Box
        backgroundImage="https://images.pexels.com/photos/998657/pexels-photo-998657.jpeg?auto=compress&cs=tinysrgb&w=5040&h=3000&dpr=2"
        backgroundAttachment="fixed"
        backgroundSize="cover"
        position="fixed"
        inset="0"
        opacity={0.5}
        zIndex={-1}
      />
      <HStack
        p={16}
        gap={4}
        width="100%"
        height="100vh"
        justifyContent="center"
      >
        <Heading size="lg">404</Heading>
        <Divider height={12} orientation="vertical" />
        <div>Sorry, we couldn't find that page for you.</div>
      </HStack>
    </>
  );
}

export default withDefaultTheme(NotFound);
