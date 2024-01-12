import { Box, Button, Heading, Text } from '@chakra-ui/react';
import { ZipperLogo, ZipperSymbol } from '@zipper/ui';
import Link from 'next/link';

export default function FoundersNote({ callbackUrl }: { callbackUrl: string }) {
  const link = callbackUrl ? decodeURIComponent(callbackUrl) : '/dashboard';

  const BETA_SIGNAGE_CONTENT = {
    TITLE: `You're in.`,
    SUBTITLE: 'A quick note from the makers of Zipper:',
    CONTENT: [
      'First of all, we want to thank you for checking out our beta. We hope that using Zipper will be as fun, inspiring, and productive for you as it has been for us.',
      `As you know being fellow builders of software, user feedback is invaluable. Smash that feedback button and give us all your ideas, bugs, gripes, jokes, whatever. We're stoked to hear from you.`,
      'Looking forward to seeing what you create!',
      'Sachin and Ibu',
    ].join('\n\n'),
  };

  return (
    <Box
      w="full"
      as="main"
      m="0 auto"
      position="relative"
      bg="white"
      overflowY="hidden"
      overflowX="hidden"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection={'column'}
    >
      <ZipperLogo />
      <Box
        maxW={'600px'}
        boxShadow="xl"
        px={12}
        py={10}
        display="flex"
        flexDirection={'column'}
        gap={4}
        mt={12}
        whiteSpace={{ md: 'pre-line' }} //important for \n new lines
      >
        <Heading
          fontSize={'2xl'}
          color="gray.900"
          alignSelf={'center'}
          textAlign={'center'}
          py={4}
        >
          {BETA_SIGNAGE_CONTENT.TITLE}
        </Heading>
        <Heading as="h3" fontSize={'md'} color="#89279B">
          {BETA_SIGNAGE_CONTENT.SUBTITLE}
        </Heading>
        <Text color="gray.900">{BETA_SIGNAGE_CONTENT.CONTENT}</Text>
        <Signatures />
        <Link href={link}>
          <Button
            bgColor={'#9B2FB4'}
            _hover={{ backgroundColor: 'purple' }}
            as="a"
            w={'full'}
          >
            <ZipperSymbol height={20} fill="white" />
            <Text color="white">Launch Zipper</Text>
          </Button>
        </Link>
      </Box>
    </Box>
  );
}

const Signatures = () => {
  return (
    <svg
      width="210"
      height="56"
      viewBox="0 0 210 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Founders Signatures</title>
      <path
        d="M1.396 44.8028C38.1787 39.2562 36.3383 4.37313 24.2106 7.90552C9.93207 12.0644 59.5103 36.931 55.5613 43.1362C49.614 52.4814 24.0181 48.211 22.7103 46.1115C22.1487 45.2099 38.8002 41.4333 40.0756 41.1787C45.4168 40.1127 50.9342 39.5282 56.0786 37.9825C56.7004 37.7956 57.32 37.5946 57.9238 37.3785C58.1691 37.2906 58.6825 36.9526 58.6825 37.152C58.6825 37.4203 57.656 37.8079 57.4409 38.0076C55.6846 39.6388 60.3705 38.7139 61.321 38.5613C67.7468 37.5297 74.929 37.6764 72.5472 40.7257C71.3918 42.2049 80.0041 41.1787 82.4111 41.1787"
        stroke="#0766B7"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M117.521 28.3841C132.675 22.7524 137.164 19.3175 135.007 19.3734C132.849 19.4293 130.32 24.9883 131.881 25.1594C143.055 26.3845 166.173 15.5197 174.189 6.95728C176.861 4.10313 171.576 -3.82652 163.273 7.24018C159.826 11.8353 156.966 21.1133 152.558 24.3913C152.134 24.7069 151.711 24.7354 152.548 23.9899C154.031 22.6692 156.611 20.1089 158.739 20.0537C161.758 19.9755 160.603 23.0999 155.421 24.4718C159.939 26.1555 173.12 22.3171 177.398 21.1273C178.907 20.7076 180.976 20.2762 182.193 19.0734C182.446 18.8224 182.166 18.7428 181.973 18.9206C181.226 19.6105 179.393 23.4975 180.828 23.5553C185.737 23.4281 187.809 17.1343 187.881 19.9328C187.996 24.3755 205.038 25.7711 208.343 22.3389"
        stroke="#0766B7"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M141.564 9.58328C134.172 6.23718 130.26 12.3217 133.39 12.7212C136.519 13.1207 142.909 8.63125 138.621 5.48077"
        stroke="#0766B7"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
};
