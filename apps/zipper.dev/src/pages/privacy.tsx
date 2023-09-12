import { Box, Heading } from '@chakra-ui/react';
import { Website } from '@zipper/ui';
import NextLink from 'next/link';

export default function PrivacyPage() {
  return (
    <Website>
      <Website.Navbar links={{ component: NextLink }} />
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        as="main"
        w="full"
        margin="0 auto"
      >
        <Heading fontFamily="plaak" fontSize="3xl">
          PRIVACY POLICY
        </Heading>
        <Website.Footer links={{ component: NextLink }} />
      </Box>
    </Website>
  );
}
