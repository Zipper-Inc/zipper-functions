import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import Header from '~/components/header';
import { NextPageWithLayout } from './_app';

const NotFound: NextPageWithLayout = () => {
  return (
    <Container maxW={'3xl'}>
      <Stack
        as={Box}
        textAlign={'center'}
        spacing={{ base: 8, md: 14 }}
        py={{ base: 20, md: 36 }}
      >
        <Heading
          fontWeight={600}
          fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }}
          lineHeight={'110%'}
        >
          Whoop there it isn't.
        </Heading>
        <Text color={'fg.500'} maxW={'3xl'}>
          Looks like the page you're looking for doesn't exist or isn't
          accessible to you.
        </Text>
      </Stack>
    </Container>
  );
};

NotFound.header = () => <Header showNav={false}></Header>;
NotFound.skipAuth = true;

export default NotFound;
