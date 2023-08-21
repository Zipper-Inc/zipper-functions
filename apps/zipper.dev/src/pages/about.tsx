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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import Image from 'next/image';
import Header from '~/components/header';
import { NextPageWithLayout } from './_app';
import Footer from '~/components/footer';

const AboutPage: NextPageWithLayout = () => {
  return (
    <Box w="full">
      <Box w="full" position="relative" py={12}>
        <Flex
          margin="0 auto"
          gap={8}
          align="center"
          justify="center"
          maxW="container.lg"
          w="full"
          zIndex="10"
          position="relative"
        >
          <Box alignSelf="flex-start">
            <Heading
              color="purple.600"
              fontSize="5xl"
              w="md"
              textTransform="uppercase"
              fontFamily="plak"
            >
              There’s magic
              <br /> in building software
            </Heading>
          </Box>

          <Box maxW="lg">
            <Text color="neutral.900" m={0} fontSize="xl">
              It’s empowering to be able to take an idea, no matter how simple
              or silly, and turn it into something real that people use.
            </Text>

            <Text color="neutral.900" m={0} fontSize="xl">
              Unfortunately there's a lot of cruft (especially in a work
              context) that gets in the way of being able to do this.
            </Text>

            <Text color="neutral.900" m={0} fontSize="xl">
              With Zipper, we're aiming to simplify things. You no longer have
              to think about authentication, frameworks, servers, deployments,
              and all the other stuff that gets in the way of just building,
              creating, and having fun.
            </Text>
          </Box>
        </Flex>
      </Box>
      <Box w="full" pt="12" position="relative" zIndex={10}>
        <Flex margin="0 auto" justify="center" maxW="container.lg" w="full">
          <HStack alignItems="flex-start" alignSelf="flex-start">
            <Box display="flex" flexDirection="row" gap={4}>
              <Box>
                <Heading
                  color="blue.300"
                  fontSize="2xl"
                  w="md"
                  textTransform="uppercase"
                  fontFamily="plak"
                >
                  THE TEAM
                </Heading>
                <Text color="neutral.900" m={0} maxW="md" fontSize="md" my={4}>
                  We’re a small team that likes to build software that helps
                  people build software.
                </Text>
                <Text color="neutral.900" m={0} maxW="md" fontSize="md">
                  Our experience across different companies like Slack and
                  GitHub has taught us that people can do incredibly creative
                  things given the space and opportunity. We're building Zipper
                  as a platform to bring that creativity out.
                </Text>
              </Box>
              <HStack>
                <Card mr={4}>
                  <CardHeader m={0} p={0}>
                    <Image
                      style={{ borderRadius: '8px 8px 0 0 0' }}
                      src="/static/sachin.png"
                      width="280"
                      height="280"
                      alt="Sachin Ranchod"
                    />
                  </CardHeader>
                  <CardBody>
                    <Text color="blue.500" fontSize="3xl" fontWeight="bold">
                      Sachin <br />
                      Ranchod
                    </Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader m={0} p={0} borderTopRadius={8}>
                    <Image
                      style={{ borderRadius: '8px 8px 0 0' }}
                      src="/static/ibu.png"
                      width="280"
                      height="280"
                      alt="Sachin Ranchod"
                    />
                  </CardHeader>
                  <CardBody>
                    <Text color="blue.500" fontSize="3xl" fontWeight="bold">
                      Ibu
                      <br /> Madha
                    </Text>
                  </CardBody>
                </Card>
              </HStack>
            </Box>
          </HStack>
        </Flex>
      </Box>
      <Box w="full" py="32" mt="-36px" position="relative" bg="brandGray.100">
        <Flex margin="0 auto" justify="center" maxW="container.lg" w="full">
          <HStack alignItems="flex-start" alignSelf="flex-start">
            <Box w="50%" lineHeight="28px">
              <Heading color="red.400" fontFamily="plak">
                OPEN ROLES
              </Heading>
              <Text mt={2}>
                We’re a small team that likes to build software that helps
                people build software.
              </Text>
              <Text>
                <br />
                Our experience across different companies like Slack and GitHub
                has taught us that people can do incredibly creative things
                given the space and opportunity. We're building Zipper as a
                platform to bring that creativity out.
              </Text>
            </Box>
            <Box w="50%">
              <Accordion
                mt={12}
                defaultIndex={[0]}
                allowMultiple
                bgColor="white"
                borderTopWidth="0px"
                borderTopColor="transparent"
                p={6}
                borderRadius={8}
              >
                <AccordionItem border="none">
                  <Heading textColor="red.400">
                    <AccordionButton>
                      <Box
                        as="span"
                        flex="1"
                        textAlign="left"
                        fontSize="3xl"
                        fontWeight="bold"
                      >
                        Head of Design
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </Heading>
                  <AccordionPanel pb={4}>
                    <Box
                      as="span"
                      flex="1"
                      textAlign="left"
                      fontSize="2xl"
                      fontWeight="bold"
                      color="neutral.800"
                    >
                      Remote/US West
                    </Box>
                    <Text>
                      Help us set and execute a product design strategy and
                      vision for Zipper that empowers developers while remaining
                      simple and delightful. We know that the product experience
                      is going to be key to helping people understand what's
                      possible with Zipper and software within their businesses.
                      It's a big challenge and a bigger opportunity. Once here
                      you will: Develop and execute a design strategy that
                      solves customer needs and achieves business goals. Own all
                      aspects of product design at Zipper - everything from
                      design aesthetic to the interaction model - across web,
                      mobile, and various integration channels. Employ research,
                      storytelling, design systems, and design thinking to solve
                      customer needs and achieve business goals. Prototype and
                      iterate quickly based on intuition and user feedback.
                      Partner with product and engineering to ensure
                      high-quality and consistent implementation and UX. Provide
                      input and opinions on brand &amp; marketing design. We're
                      looking for: At least 5 years of relevant experience
                      designing delightful enterprise and/or consumer web
                      applications from the ground up. A relaxed and curious
                      approach to ambiguous problems. Experience and willingness
                      to single-handedly drive the entire product design
                      process. Strong attention to detail and a keen eye for
                      visual design. Track record of using prototypes and
                      experiments to validate ideas. A collaborative design
                      partner that's excited to build a product from the ground
                      up. Benefits: Healthcare (health, dental, vision) Flexible
                      PTO (with a 15 day minimum) Parent-friendly environment
                      Autonomy, Ownership, Equity Interested? We'd love to hear
                      from you. Send your resume, portfolio, or any other useful
                      information to dreamteam@zipper.works
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </HStack>
        </Flex>
      </Box>
      <Box
        w="full"
        py="32"
        mt="-36px"
        position="relative"
        bg="brandGray.100"
        display="flex"
        flexDirection="column"
        alignSelf="flex-start"
      >
        <Flex margin="0 auto" w="container.lg" direction="column">
          <Heading color="purple.600" fontFamily="plak">
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
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
};

AboutPage.header = () => <Header showOrgSwitcher={true} showDivider={false} />;

export default AboutPage;
