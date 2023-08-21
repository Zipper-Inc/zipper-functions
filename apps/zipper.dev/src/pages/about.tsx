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
    <VStack spacing={8} align="center">
      <Flex
        px={{ base: 8, md: 0 }}
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start' }}
        gap={8}
        mt={20}
      >
        <Heading
          alignSelf={{ base: 'center', md: 'flex-start' }}
          textAlign={{ base: 'left', md: 'left' }}
          fontSize={{ base: '4xl', md: '5xl' }}
          color="purple.600"
          w={{ base: 'full', md: 'lg' }}
          fontFamily="plak"
          textTransform="uppercase"
          fontWeight={400}
        >
          There’s magic in building software
        </Heading>

        <Text
          textAlign={{ base: 'left' }}
          fontSize="xl"
          color="neutral.900"
          w={{ base: 'full', md: 'lg' }}
        >
          It’s empowering to be able to take an idea, no matter how simple or
          silly, and turn it into something real that people use. Unfortunately
          there's a lot of cruft (especially in a work context) that gets in the
          way of being able to do this. With Zipper, we're aiming to simplify
          things. You no longer have to think about authentication, frameworks,
          servers, deployments, and all the other stuff that gets in the way of
          just building, creating, and having fun.
        </Text>
      </Flex>
      <HStack
        flexDir={{ base: 'column', md: 'row' }}
        align={{ base: 'center', md: 'flex-start' }}
        w={{ base: 'full', md: 'container.lg' }}
        justify={{ base: 'center', md: 'space-between' }}
        px={{ base: 8, md: 0 }}
      >
        <Box maxW={{ base: 'full', md: '50%' }}>
          <Heading
            textAlign="left"
            fontSize="2xl"
            color="blue.300"
            fontFamily="plak"
            textTransform="uppercase"
            fontWeight={400}
          >
            The Team
          </Heading>

          <Text textAlign="left" fontSize="md" color="neutral.900">
            We’re a small team that likes to build software that helps people
            build software. Our experience across different companies like Slack
            and GitHub has taught us that people can do incredibly creative
            things given the space and opportunity. We're building Zipper as a
            platform to bring that creativity out.
          </Text>
        </Box>
        <Flex maxW={{ base: 'full', md: '50%' }} gap={8}>
          <Card maxW="sm">
            <CardHeader m={0} p={0} borderTopRadius={8}>
              <Image
                src="/static/sachin.png"
                alt="Sachin Ranchod"
                style={{ borderRadius: '8px 8px 0 0 0' }}
                width="280"
                height="280"
              />
            </CardHeader>
            <CardBody>
              <Text fontSize="3xl" color="blue.500" fontWeight="bold">
                Sachin <br />
                Ranchod
              </Text>
            </CardBody>
          </Card>

          <Card maxW="sm">
            <CardHeader m={0} p={0} borderTopRadius={8}>
              <Image
                src="/static/ibu.png"
                alt="Ibu Madha"
                style={{ borderRadius: '8px 8px 0 0 0' }}
                width="280"
                height="280"
              />
            </CardHeader>
            <CardBody>
              <Text fontSize="3xl" color="blue.500" fontWeight="bold">
                Ibu <br /> Madha
              </Text>
            </CardBody>
          </Card>
        </Flex>
      </HStack>

      <Flex
        flexDir={{ base: 'column', md: 'row' }}
        align={{ base: 'center', md: 'flex-start' }}
        maxW="container.lg"
        px={{ base: 8, md: 0 }}
      >
        <Box w={{ base: 'full', md: '50%' }} mb={{ base: 4, md: 0 }}>
          <Heading
            color="red.400"
            fontSize="2xl"
            fontFamily="plak"
            textTransform="uppercase"
            fontWeight={400}
          >
            Open Roles
          </Heading>

          <Text mt={2} fontSize="md" color="neutral.900">
            We’re a small team that likes to build software that helps people
            build software. Our experience across different companies like Slack
            and GitHub has taught us that people can do incredibly creative
            things given the space and opportunity. We're building Zipper as a
            platform to bring that creativity out.
          </Text>
        </Box>

        <Box w={{ base: 'full', md: '50%' }}>
          <Accordion
            allowToggle
            mt={4}
            defaultIndex={[0]}
            allowMultiple
            bgColor="white"
            borderTopWidth="0px"
            borderTopColor="transparent"
            p={{ base: 0, md: 6 }}
            borderRadius={8}
          >
            <AccordionItem border="none">
              <AccordionButton>
                <Heading
                  flex="1"
                  textAlign="left"
                  fontSize="3xl"
                  color="red.400"
                >
                  Head of Design
                  <AccordionIcon />
                </Heading>
              </AccordionButton>

              <AccordionPanel>
                <Text>
                  Help us set and execute a product design strategy and vision
                  for Zipper that empowers developers while remaining simple and
                  delightful. We know that the product experience is going to be
                  key to helping people understand what's possible with Zipper
                  and software within their businesses. It's a big challenge and
                  a bigger opportunity. Once here you will: Develop and execute
                  a design strategy that solves customer needs and achieves
                  business goals. Own all aspects of product design at Zipper -
                  everything from design aesthetic to the interaction model -
                  across web, mobile, and various integration channels. Employ
                  research, storytelling, design systems, and design thinking to
                  solve customer needs and achieve business goals. Prototype and
                  iterate quickly based on intuition and user feedback. Partner
                  with product and engineering to ensure high-quality and
                  consistent implementation and UX. Provide input and opinions
                  on brand &amp; marketing design. We're looking for: At least 5
                  years of relevant experience designing delightful enterprise
                  and/or consumer web applications from the ground up. A relaxed
                  and curious approach to ambiguous problems. Experience and
                  willingness to single-handedly drive the entire product design
                  process. Strong attention to detail and a keen eye for visual
                  design. Track record of using prototypes and experiments to
                  validate ideas. A collaborative design partner that's excited
                  to build a product from the ground up. Benefits: Healthcare
                  (health, dental, vision) Flexible PTO (with a 15 day minimum)
                  Parent-friendly environment Autonomy, Ownership, Equity
                  Interested? We'd love to hear from you. Send your resume,
                  portfolio, or any other useful information to
                  dreamteam@zipper.works
                </Text>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      </Flex>
      <Flex
        flexDirection="column"
        bg="brandGray.100"
        py={32}
        w="full"
        align="center"
        mb={0}
      >
        <Box px={{ base: 8, md: 0 }}>
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
        </Box>
      </Flex>
      <Footer />
    </VStack>
  );
};

AboutPage.header = () => <Header showOrgSwitcher={true} showDivider={false} />;

export default AboutPage;
