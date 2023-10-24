import {
  Flex,
  Box,
  Text,
  Heading,
  Link,
  Card,
  CardHeader,
  CardBody,
  Grid,
  GridItem,
  SimpleGrid,
  Container,
} from '@chakra-ui/react';
import Image from 'next/image';
import Header from '~/components/header';
import { NextPageWithLayout } from './_app';
import NextLink from 'next/link';
import { Website } from '@zipper/ui';
import { useAnalytics } from '~/hooks/use-analytics';
import { useEffect } from 'react';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const POSITION_DETAILS = `Help us set and execute a product design strategy and vision for Zipper that empowers developers while remaining simple and delightful.

We know that the product experience is going to be key to helping people understand what's possible with Zipper and software within their businesses. It's a big challenge and a bigger opportunity.

Interested? We'd love to hear from you. Send your resume, portfolio, or any other useful information to dreamteam@zipper.works
`;

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

const AboutPage: NextPageWithLayout = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics?.page('Marketing Site', 'About');
  }, []);

  return (
    <Website>
      <Website.Navbar links={{ component: NextLink }} />
      <Flex
        align="center"
        as="main"
        direction="column"
        pt={[25]}
        w="full"
        gap={20}
      >
        <Container w="full" maxW="container.xl" position="relative">
          <Flex
            margin="0 auto"
            gap={8}
            direction={{ base: 'column', lg: 'row' }}
            align="start"
            justify="space-between"
            w="full"
            zIndex="10"
            position="relative"
          >
            <Heading
              color="purple.600"
              fontSize={['4xl', '6xl']}
              fontWeight={400}
              textTransform="uppercase"
              fontFamily="plaak"
              whiteSpace="pre-line"
            >
              {`There’s magic 
              in building 
              software`}
            </Heading>

            <Box maxW={{ lg: '47%' }}>
              <Text
                color="gray.900"
                m={0}
                fontSize={{ base: '18px', lg: '2xl' }}
                whiteSpace={{ lg: 'pre-line' }}
              >
                It’s empowering to be able to take an idea, no matter how simple
                or silly, and turn it into something real that people use.
                <br />
                <br />
                Unfortunately there's a lot of cruft (especially in a work
                context) that gets in the way of being able to do this.
                <br />
                <br />
                <Text as="span" fontWeight={600} color="purple.500">
                  With Zipper, we're aiming to simplify things.
                </Text>{' '}
                You no longer have to think about authentication frameworks,
                servers, deployments, and all the other stuff that gets in the
                way of just building, creating, and having fun.
              </Text>
            </Box>
          </Flex>
        </Container>

        <Box
          as={Flex}
          justifyContent="center"
          w="full"
          position="relative"
          bg={['brandGray.100', 'none']}
          zIndex={10}
        >
          <Container w="full" alignItems="start" pb={10} maxW="container.xl">
            <Heading
              color="blue.500"
              fontSize="4xl"
              textTransform="uppercase"
              fontFamily="plaak"
            >
              THE TEAM
            </Heading>

            <Flex
              direction={{ base: 'column', lg: 'row' }}
              align={{ base: 'center', lg: 'start' }}
              w="full"
              gap={5}
            >
              <Text
                whiteSpace={{ lg: 'pre-line' }}
                fontSize={['18px']}
                flex={1}
                color="gray.900"
              >
                {`We’re a small team that likes to build software that helps
                people build software.`}
                <br />
                <br />
                {`Our experience across different companies like Slack and GitHub
                has taught us that people can do incredibly creative things given the 
                space and opportunity. We're building Zipper as a platform to bring
                that creativity out.`}
              </Text>
              <Grid
                w={{ base: 'full', lg: '47%' }}
                templateColumns={'repeat(2, 1fr)'}
                gap={5}
              >
                <Card as={GridItem} boxShadow="none" bg="white">
                  <CardHeader
                    style={{ aspectRatio: '1/1' }}
                    width="full"
                    position="relative"
                  >
                    <Image
                      src="https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/6f1ce348-dde5-4e05-5328-7c19cc393d00/public"
                      fill
                      style={{
                        objectFit: 'cover',
                      }}
                      alt="Sachin Ranchod"
                    />
                  </CardHeader>
                  <CardBody>
                    <Text
                      lineHeight={['30px', '38px']}
                      color="blue.500"
                      fontSize={{ base: 'xl', lg: '3xl' }}
                      fontWeight="bold"
                    >
                      Sachin <br />
                      Ranchod
                    </Text>
                  </CardBody>
                </Card>
                <Card as={GridItem} boxShadow="none" bg="white">
                  <CardHeader
                    style={{ aspectRatio: '1/1' }}
                    position="relative"
                  >
                    <Image
                      src="https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/747e75e8-fbe9-409f-6e59-f3edf26ccb00/public"
                      fill
                      style={{
                        objectFit: 'cover',
                      }}
                      alt="Sachin Ranchod"
                    />
                  </CardHeader>
                  <CardBody>
                    <Text
                      lineHeight={['30px', '38px']}
                      color="blue.500"
                      fontSize={{ base: 'xl', lg: '3xl' }}
                      fontWeight="bold"
                    >
                      Ibu
                      <br /> Madha
                    </Text>
                  </CardBody>
                </Card>
              </Grid>
            </Flex>
          </Container>
        </Box>
        <Flex
          w="full"
          direction="column"
          gap={20}
          align="center"
          position="relative"
          zIndex={10}
          mt={-20}
          pt={20}
          bg="brandGray.100"
        >
          <Container w="full" alignItems="start" maxW="container.xl">
            <a id="careers" style={{ position: 'relative', top: '-32px' }} />

            <Heading
              color="brandOrange.500"
              fontSize="4xl"
              textTransform="uppercase"
              fontFamily="plaak"
            >
              OPEN ROLES
            </Heading>

            <SimpleGrid
              templateColumns={{ base: '1fr', lg: '1fr 47%' }}
              spacing={5}
              w="full"
            >
              <Text flex={1} fontSize={['18px']} color="gray.900">
                {`We’re a small team  that likes to build software that helps
                people build software.`}
                <br />
                <br />
                {`Our experience across different companies like Slack and GitHub
                has taught us that people can do incredibly creative things
                given the space and opportunity. We're building Zipper as a
                platform to bring that creativity out.`}
                <br />
                <br />
                {`We’re currently not actively hiring but interested to hear where you think you could fit in. Send a note to `}
                <a href="mailto:jobs@zipper.works">jobs@zipper.works</a>
                {` along with a resume or portfolio.`}
              </Text>

              {/*
              <Accordion defaultIndex={[0]} allowMultiple>
                <AccordionItem border="none" bg="white">
                  <h2>
                    <AccordionButton p={10} _hover={{ bg: 'white' }}>
                      <Box as="span" flex="1" textAlign="left">
                        <Heading
                          as="h3"
                          textColor="brandOrange.500"
                          fontSize={['30px']}
                        >
                          Head of Design
                        </Heading>
                        <Heading as="h4" color="gray.900" fontSize={['xl']}>
                          Remote/US West
                        </Heading>
                      </Box>
                      <AccordionIcon fontSize={['24px']} color="gray.500" />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel
                    px={10}
                    pb={10}
                    whiteSpace="pre-line"
                    color="gray.900"
                  >
                    {POSITION_DETAILS}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
              */}
            </SimpleGrid>
          </Container>

          <Container w="full" alignItems="start" maxW="container.xl">
            <a id="contact" style={{ position: 'relative', top: '-32px' }} />

            <Heading color="purple.600" fontFamily="plaak">
              CONTACT
            </Heading>
            <Text color="neutral.900" mt={2}>
              Send us an email at &nbsp;
              <Link color="purple.600" href="mailto:hello@zipper.works">
                hello@zipper.works
              </Link>{' '}
              and we'll respond to you as
              <br /> quickly as possible.
            </Text>
          </Container>
          <Website.Footer links={{ component: NextLink }} />
        </Flex>
      </Flex>
    </Website>
  );
};

AboutPage.header = () => <Header showOrgSwitcher={true} showDivider={false} />;
AboutPage.skipAuth = true;

export default AboutPage;
