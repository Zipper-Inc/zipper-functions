import {
  Flex,
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Link,
  Card,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';
import Image from 'next/image';
import Header from '~/components/header';
import { NextPageWithLayout } from './_app';
import Footer from '~/components/footer';

const AboutPage: NextPageWithLayout = () => {
  return (
    <VStack height="100vh">
      <Flex
        align="center"
        css={{ margin: '0 auto' }}
        justify="space-between"
        minH="calc(100vh-20%)"
        w="full"
        maxW="container.lg"
        direction="column"
        flex="1"
        gap={16}
      >
        <HStack alignItems="flex-start" alignSelf="flex-start">
          <Box display="flex" flexDirection="row">
            <Heading
              color="purple.600"
              fontSize="5xl"
              w="md"
              textTransform="uppercase"
            >
              There’s magic
              <br /> in building software
            </Heading>
            <Text color="neutral.900" m={0} maxW="md">
              It’s empowering to be able to take an idea, no matter how simple
              or silly, and turn it into something real that people use.
              Unfortunately there's a lot of cruft (especially in a work
              context) that gets in the way of being able to do this.
              <br /> With Zipper, we're aiming to simplify things. You no longer
              have to think about authentication, frameworks, servers,
              deployments, and all the other stuff that gets in the way of just
              building, creating, and having fun.
            </Text>
          </Box>
        </HStack>

        <HStack alignItems="flex-start" alignSelf="flex-start">
          <Box display="flex" flexDirection="row">
            <Box>
              <Heading
                color="blue.300"
                fontSize="2xl"
                w="md"
                textTransform="uppercase"
              >
                THE TEAM
              </Heading>
              <Text color="neutral.900" m={0} maxW="md" fontSize="sm" my={4}>
                We’re a small team that likes to build software that helps
                people build software.
              </Text>
              <Text color="neutral.900" m={0} maxW="md" fontSize="sm">
                Our experience across different companies like Slack and GitHub
                has taught us that people can do incredibly creative things
                given the space and opportunity. We're building Zipper as a
                platform to bring that creativity out.
              </Text>
            </Box>
            <HStack>
              <Card>
                <CardHeader>
                  <Image
                    src="https://gravatar.com/avatar/a?s=280"
                    width="280"
                    height="280"
                    alt="Sachin Ranchod"
                  />
                </CardHeader>
                <CardBody>
                  <Text>Sachin Ranchod</Text>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Image
                    src="https://gravatar.com/avatar/a?s=280"
                    width="280"
                    height="280"
                    alt="Sachin Ranchod"
                  />
                </CardHeader>
                <CardBody>
                  <Text>Ibu Madha</Text>
                </CardBody>
              </Card>
            </HStack>
          </Box>
        </HStack>

        <HStack display="flex" flexDirection="column" alignSelf="flex-start">
          <Box>
            <Heading color="purple.600">CONTACT</Heading>
            <Text color="neutral.900" m={0}>
              Send us an email at
              <Link colorScheme="purple" href="mailto:hello@zipper.works">
                hello@zipper.works
              </Link>{' '}
              and we'll respond to you as quickly as possible.
            </Text>
          </Box>
        </HStack>
      </Flex>
      <Footer />
    </VStack>
  );
};

AboutPage.header = () => <Header showOrgSwitcher={true} showDivider={false} />;

export default AboutPage;
