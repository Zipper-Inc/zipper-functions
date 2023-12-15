/* eslint-disable @next/next/no-img-element */
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  useMediaQuery,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure,
  HStack,
  Icon,
  Button,
  Stack,
} from '@chakra-ui/react';
import { baseColors, Website } from '@zipper/ui';
import React, { memo, useEffect } from 'react';
import NextLink from 'next/link';
import Carousel from 'nuka-carousel';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiKey,
  FiSliders,
  FiCheck,
  FiPlay,
  FiSettings,
  FiTool,
  FiCode,
  FiLoader,
} from 'react-icons/fi';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useAnalytics } from '~/hooks/use-analytics';
import Link from 'next/link';
import { HiArrowUpRight } from 'react-icons/hi2';
import { NextPageWithLayout } from './_app';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';
import Head from 'next/head';
import { PiPlayCircle } from 'react-icons/pi';
import { AnalyticsHead } from '@zipper/utils';

/* -------------------------------------------- */
/* Content                                      */
/* -------------------------------------------- */

const HERO_CONTENT = {
  TITLE: 'Complexity-free\nWeb Development',

  DESCRIPTION: `Zipper helps you turn Typescript functions into modern web applications. No local setup, boilerplate, or frontend code required. Perfect for rapidly building or prototyping internal tools, SaaS integrations, and micro-services.`,
  LIST: [
    {
      description: 'Turn TypeScript functions into serverless web apps',
      icon: <FiCheck size={24} />,
    },
    {
      description: `Don't write a line of frontend, auth, or API code`,
      icon: <FiCheck size={24} />,
    },
    {
      description: `Do everything in your browser - start immediately with no setup`,
      icon: <FiCheck size={24} />,
    },
  ],
};

const WEB_FIRST_CONTENT = {
  TITLE: 'Build for the web',
  DESCRIPTION: `Zipper is designed for building web services quickly. Every applet is
  deployed to a public-facing URL and can immediately start receiving
  GET & POST requests. Perfect for building user-facing web applications
  or API-based integrations.`,

  LIST: [
    {
      ICON: <FiSettings />,
      TITLE: 'Code-first SaaS Integrations',
      COLOR: 'blue',
      DESCRIPTION:
        'Automate repetitive tasks and workflows or respond to triggers with the flexibility of code. You don’t have to be limited by the constraits of no-code tools.',
      IMAGE_URL:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/211e9adc-3f4c-4c2e-9dd6-5a0adf8d5700/w=1000',
      IMAGE_WIDTH: 700,
    },
    {
      ICON: <FiTool />,
      TITLE: 'Internal Tools as a Service',
      COLOR: 'brandOrange',
      DESCRIPTION:
        'A better way to run scripts or create admin tools for your own APIs or databases. With auth and audit logs built-in, never build from scratch.',
      IMAGE_URL:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/11b63372-4d13-4c4b-f7f3-912da40b7800/w=1000',
      IMAGE_WIDTH: 500,
    },
    {
      ICON: <FiCode />,
      TITLE: 'Worker Functions',
      COLOR: 'purple',
      DESCRIPTION:
        'Handle expensive or unique tasks on our edge infrastructure, close to your users. Run them on a schedule or in response to an event to effortlessly scale your apps.',
      IMAGE_URL:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/8439e4a6-927e-4740-8a4b-edfa2325a900/w=1000',
      IMAGE_WIDTH: 500,
    },
    {
      ICON: <FiLoader />,
      TITLE: 'Anything else you want',
      COLOR: 'gray',
      DESCRIPTION:
        'An instant TypeScript REPL with a built-in frontend framework where you can see your results immediately. What will you build?',
      IMAGE_URL:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/253fbbfa-2d03-40d8-e464-19030c7d1800/w=3000',
      IMAGE_WIDTH: 1500,
    },
  ],
};

const FEATURES_CONTENT = {
  TITLE: 's/decisions/deploys',
  TITLE_SM: 's/decisions/\ndeploys',

  DESCRIPTION: `Your project shouldn’t be held up by a hundred decisions about
  hosting, routing, storage, and more — half of which you have to
  rethink because these services don’t all work together.`,

  SPAN: `Zipper gives you all the scaffolding you need to start
  shipping immediately`,
  LIST: [
    {
      title: 'Instant deploys',
      color: baseColors.purple['500'],
      description:
        'Publish your code to a public facing URL with the click of a button.  ',
      picture:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/8f2c712f-73e1-4248-699c-5d3b2085d800/public',
    },
    {
      title: 'A simple web framework',
      color: baseColors.brandOrange['500'],
      description:
        'Every file that exports a `handler` function automatically becomes a route in your app. Pass inputs to your handler, get back an output. ',
      picture:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/58a167ac-6b48-42ea-c950-98b380a0be00/public',
    },
    {
      title: 'UI without any frontend code',
      color: baseColors.blue['500'],
      description:
        'The inputs to your functions become forms to collect user input and the outputs get turned into a functional UI.	  ',
      picture:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/e1b24cae-5c03-4890-b8cf-96cd10093a00/public',
    },
    {
      title: 'API endpoints for every route',
      color: baseColors.purple['500'],
      description:
        'Every route accepts GET & POST requests that can be secured with bearer tokens. Perfect for receiving webhooks or integrating into other pieces of software.',
      picture:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/4c396c98-bb64-4e66-8e75-c0425eda7900/public',
    },
    {
      title: 'Built-in storage',
      color: baseColors.blue['500'],
      description:
        'Each applet has its own KV store for managing data across runs.   ',
      picture:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/08072c02-05da-4755-47a5-3571686c6d00/public',
    },
    {
      title: 'Authentication connectors',
      color: baseColors.purple['500'],
      description:
        'Force users to sign in to other services (such as Slack or GitHub) before running your applet.',
      picture:
        'https://imagedelivery.net/mehHBP8u01yKLn8uDjx8Yw/3c692d41-2053-4f20-7e85-de5ef3d80c00/public',
    },
  ],
};

const APPLETS_GALERY_CONTENT = {
  TITLE: 'hello ${working code}',
  DESCRIPTION: `Chances are that the thing you need to build has already been thought through by
  someone else. Zipper’s applet directory lets you fork pre-built applications that you can
  immediately use or quickly customize to better suit your needs. If you don’t see what you’re
  looking for, you can start from a blank file or have AI generate some code for you ✨.`,
};

const APPLET_GALLERY_LIST = [
  {
    title: 'Slack Backlinker',
    description:
      "Easily reference important messages, threads, or documents with a click, keeping your team's communication organized and efficient.",
    slug: 'slack-backlinker',
    url: 'https://zipper.dev/zipper-inc/slack-github-backlinks/src/readme.md',
  },
  {
    title: 'Team Bookmarks',
    description:
      "Effortlessly access and share links in Slack using intuitive slash commands. Retrieve important URLs with speed and simplicity, enhancing your team's productivity and knowledge sharing.",
    slug: 'team-go-links',
    url: 'https://zipper.dev/zipper-inc/team-links/src/readme.md',
  },
  {
    title: 'JSON Explorer',
    description:
      "Instantly fetch a repository's dependency list. Gain valuable insights into each package with real-time NPM statistics and automatically generated descriptions, helping you understand their role within your application.",
    slug: 'json-explorer',
    url: 'https://zipper.dev/zipper-inc/package-json-explorer/src/readme.md',
  },
  {
    title: 'User Feedback Button',
    description:
      'Easily collect valuable feedback with this button, fostering communication and improving your product based on user insights.',
    slug: 'user-feedback-button',
    url: 'https://zipper.dev/zipper-inc/feedback-tracker/src/readme.md',
  },
  {
    title: 'Airtable Expense Tracker',
    description:
      'Connect and automate expense management. This embed applet seamlessly integrates with your Airtable workspace, effortlessly handling new records and providing real-time financial insights.',
    slug: 'airtable-expense-tracker',
    url: 'https://zipper.dev/zipper-inc/expense-tracking-airtable/src/readme.md',
  },
  {
    title: 'In-product changelog',
    description:
      'Display updates, enhancements, and new features directly within your application, ensuring users stay in the loop and can make the most of your latest changes.',
    slug: 'in-product-changelog',
    url: 'https://zipper.dev/zipper-inc/in-product-changelog/src/readme.md',
  },
  {
    title: 'Waitlist Manager',
    description:
      'Easily manage user registrations, track progress, and streamline communication to ensure a smooth experience for both you and your eager audience.',
    slug: 'waitlist-manager',
    url: 'https://zipper.dev/zipper-inc/waitlist-manager/src/readme.md',
  },
  {
    title: 'Incident Management Bot',
    description:
      'Your dedicated incident response assistant within Slack. This bot automates incident handling, sends real-time alerts, and guides your team through incident resolution directly in your Slack workspace.',
    slug: 'incident-managment-bot',
    url: 'https://zipper.dev/zipper-inc/incident-bot/src/readme.md',
  },
  {
    title: "What's the team listening to",
    description:
      "Sync your team's musical vibes. This app integrates with Spotify API to curate and share what your team is currently jamming to, fostering a shared musical experience within your workspace.",
    slug: 'what-team-listening-to',
    url: 'https://zipper.dev/zipper-inc/song-monitor/src/readme.md',
  },
  {
    title: 'Natural language to crontab',
    description:
      'Transform human language into computer-readable crontab syntax with AI. Easily schedule tasks and automate processes by describing them in plain English, and let the AI convert them into precise crontab schedules.',
    slug: 'natural-language-contrab',
    url: 'https://zipper.dev/zipper-inc/crontab-ai-generator/src/main.ts',
  },
  {
    title: 'GitHub WIP tracker',
    description:
      'Keep tabs on work in progress. Monitor and manage your GitHub projects with ease, tracking the status of ongoing tasks and ensuring efficient project management.',
    slug: 'github-wip-tracker',
    url: 'https://zipper.dev/zipper-inc/github-repo-wip/src/readme.md',
  },
  {
    title: 'Feature Flagging',
    description:
      'Implement feature flags to toggle functionalities on and off, allowing for flexible and controlled feature deployments within your application.',
    slug: 'feature-flagging',
    url: 'https://zipper.dev/zipper-inc/ff-onboarding-example/src/readme.md',
  },
];

const BATTERIES_CONTENT = {
  TITLE: 'Batteries included',

  DESCRIPTION: `Some days you just want to prototype something quickly to prove that it works, while the
   next day that same app needs to be production ready. Zipper provides all the tooling you
    require alongside your code so that your app can get the approval of IT and security easily.`,

  LIST: [
    {
      name: 'Always On Schedule',
      description:
        'Use our cron scheduler to run your applet on a regular basis.',
      icon: <FiCalendar size={40} />,
    },
    {
      name: 'Authentication On Demand ',
      description:
        'Turn on auth and users will have to sign in via Zipper before accessing your applet.',
      icon: <FiKey size={40} />,
    },
    {
      name: 'Automatic Audit Logs',
      description:
        'See who’s been running an applet as well as who’s been changing the code.',
      icon: <FiBookOpen size={40} />,
    },
    {
      name: 'Integrations You Control ',
      description:
        'Integrate into existing tools using official SDKs and our pre-written (but extensible) code.',
      icon: <FiSliders size={40} />,
    },
  ],
};

const HEADLINE_CONTENT = {
  SPAN: 'Overheard from some developers you definitely know:',
};

const cloudflareAccountId = 'mehHBP8u01yKLn8uDjx8Yw';
const getCloudflareImageUrl = (imageId: string, w: number) => {
  return `https://imagedelivery.net/${cloudflareAccountId}/${imageId}/w=${w}`;
};

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

/* ------------------- Hero ------------------- */

const Hero = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const box1Animation = useAnimation();
  const box2Animation = useAnimation();

  const box1Variants = {
    rest: { x: 0, y: 0 },
    anim: { x: -10, y: -10 },
  };

  const box2Variants = {
    rest: { x: 0, y: 0 },
    anim: { x: 10, y: 10 },
  };

  const onHoverStart = () => {
    box1Animation.start(box1Variants.anim);
    box2Animation.start(box2Variants.anim);
  };
  const onHoverEnd = () => {
    box1Animation.start(box1Variants.rest);
    box2Animation.start(box1Variants.rest);
  };

  const MobileVideoFigure = () => (
    <Box
      display={{ base: 'flex', lg: 'none' }}
      position="relative"
      w="full"
      mt={{ base: 8, lg: 0 }}
      as={motion.div}
    >
      <Box
        as={motion.div}
        animate={box1Animation}
        width="calc(100% + 100px)"
        mr="-25px"
        ml="-25px"
      >
        <img
          src={getCloudflareImageUrl(
            '6d291ad6-7741-4698-0d73-8df36281fb00',
            1000,
          )}
          alt="Code"
          width="100%"
        />
      </Box>

      <Box
        as={motion.div}
        whileHover={{ scale: 1.2 }}
        onClick={onOpen}
        cursor="pointer"
        animate="rest"
        width="100px"
        height="100px"
        margin="auto"
        left="0"
        right="0"
        top="calc(50% - 50px)"
        bgColor="blue.600"
        border="5px solid white"
        position="absolute"
        borderRadius="100%"
        zIndex="10"
        display="flex"
        justifyContent="center"
        alignItems="center"
        boxShadow={'2xl'}
      >
        <FiPlay size="40px" color="white" fill="white" />
      </Box>
    </Box>
  );

  const DesktopVideoFigure = () => (
    <Box
      display={{ base: 'none', lg: 'flex' }}
      flexDir="row"
      justifyContent="center"
      transition="1.5s ease-in-out"
      alignItems="center"
      position="relative"
      width="full"
      height={{ base: '50vh', md: '360px' }}
      mt={{ base: 8, md: 36 }}
      as={motion.div}
    >
      <Box
        as={motion.div}
        position="absolute"
        top="-150px"
        left={{ base: '-15px', md: '0px' }}
        maxWidth={{ md: '480' }}
        animate={box1Animation}
        flexShrink={2}
      >
        <img
          src={getCloudflareImageUrl(
            '168dffcc-8c44-4615-e2d6-7bed90191f00',
            780,
          )}
          style={{ objectFit: 'cover' }}
          width="480"
          alt="App"
        />
      </Box>

      <Box
        as={motion.div}
        position="absolute"
        width={{ md: '780' }}
        left={280}
        top={-20}
        flexShrink={0}
      >
        <img
          style={{ objectFit: 'cover' }}
          src={getCloudflareImageUrl(
            'b6a1c508-fcc2-40a9-21ab-93ea59394700',
            1700,
          )}
          width={780}
          alt="Editor"
        />
      </Box>

      <Box
        as={motion.div}
        position="absolute"
        bottom="-100px"
        right={{ base: '-45px', md: '0px' }}
        width={{ md: '291' }}
        height="400"
        animate={box2Animation}
      >
        <img
          style={{ objectFit: 'cover' }}
          src={getCloudflareImageUrl(
            '072a0be4-5e5d-4ef4-47d8-a093fa3e2c00',
            700,
          )}
          width="380"
          alt="Modal"
        />
      </Box>

      <Box
        as={motion.div}
        whileHover={{ scale: 1.2 }}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
        onClick={onOpen}
        cursor="pointer"
        animate="rest"
        width="100px"
        height="100px"
        margin="auto"
        left="0"
        right="0"
        top="calc(50% - 50px)"
        bgColor="blue.600"
        border="5px solid white"
        position="absolute"
        borderRadius="100%"
        zIndex="10"
        display="flex"
        justifyContent="center"
        alignItems="center"
        boxShadow={'2xl'}
      >
        <FiPlay size="40px" color="white" fill="white" />
      </Box>
    </Box>
  );

  return (
    <Box
      as="section"
      aria-label="hero-container"
      w="full"
      pt={{ base: '52px', md: '3rem' }}
      mt={{ base: 0, md: 0 }}
      px={['24px', 0]}
      position="relative"
      whiteSpace={{ md: 'pre-line' }} //important for \n new lines
      minH={'600px'}
    >
      <Container
        as="article"
        aria-label="hero-content"
        margin="0 auto"
        gap={8}
        flexDirection={['column', 'column', 'column', 'row']}
        alignItems="center"
        maxW={{ md: 'container.xl' }}
        w="full"
        zIndex="10"
        position="relative"
      >
        <Flex direction="column" align="center" w="full" gap={10}>
          <VStack
            color="white"
            gap={4}
            w={['full', 'auto']}
            align="center"
            py={{ lg: 10 }}
          >
            <Heading
              as={'h1'}
              fontFamily="plaak"
              fontSize={['3xl', '5xl', '7xl']}
              lineHeight={['31px', '50px', '72px']}
              fontWeight="bold"
              textAlign="center"
              whiteSpace={{ base: 'pre-line' }}
              bgGradient="linear(to-l, #d4d3d2, #EEE)"
              bgClip="text"
            >
              {HERO_CONTENT.TITLE}
            </Heading>
            <Text
              fontSize="xl"
              color="gray.200"
              css={{ margin: 0 }}
              textAlign="center"
              whiteSpace={{ lg: 'pre-line' }}
              maxW="container.md"
            >
              {HERO_CONTENT.DESCRIPTION}
            </Text>

            {/* <JoinBetaForm onOpen={onOpen} /> */}
            <Stack
              direction={{ base: 'column', lg: 'row' }}
              w={{ base: '300px', lg: '600px' }}
              gap={1}
              pt={6}
            >
              <Button
                as={NextLink}
                height="2.75rem"
                w="full"
                fontSize={{ base: 'sm', md: 'md' }}
                colorScheme="brandOrange"
                transition="all .2s ease-in-out"
                padding={{ base: '5px 8px', md: '10px 18px' }}
                color="white"
                fontWeight={500}
                href="/auth/signup"
                rounded="sm"
              >
                Join the beta
              </Button>
              <Button
                variant="outline"
                height="2.75rem"
                fontWeight="400"
                colorScheme="white"
                _hover={{
                  bg: 'white',
                  color: 'purple.500',
                }}
                display="flex"
                gap={1}
                w="full"
                onClick={onOpen}
                color="white"
              >
                <PiPlayCircle size={20} /> {'Watch a 3 minute demo'}
              </Button>
            </Stack>
          </VStack>

          <DesktopVideoFigure />
          <MobileVideoFigure />
        </Flex>
      </Container>
      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
        <ModalContent p="0">
          <ModalBody p="0">
            <Box
              as="figure"
              position="relative"
              paddingBottom="56.25%"
              height="0"
              background="transparent"
            >
              <Box
                as="iframe"
                src="https://www.loom.com/embed/d50630ac57a94f5fb1bcdcce2de85324?sid=766794ed-03a4-4917-98e7-4420e7f2c03d?autoplay=1"
                allowFullScreen
                position="absolute"
                top={0}
                left={0}
                height="100%"
                width="100%"
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const WebFirst = () => {
  const [isMobile] = useMediaQuery('(max-width: 600px)');
  return (
    <Box
      as="section"
      aria-label="features"
      w="full"
      pt={{ base: '8rem', md: '12rem' }}
      pb={{ base: '52px', md: '9rem' }}
      position="relative"
      bg="white"
    >
      <Box
        position="absolute"
        left="0"
        top="0"
        w="700px"
        h="700px"
        clipPath="polygon(0% 0%, 100% 0%, 0% 100%)"
        bg="gray.50"
        zIndex={0}
      />
      <Container
        id="features-content"
        margin="0 auto"
        flexDir="column"
        alignItems="start"
        maxW="container.xl"
        w="full"
      >
        <VStack
          as="article"
          zIndex={10}
          position="relative"
          align="start"
          mb={10}
          gap={3}
        >
          <Heading
            fontFamily="plaak"
            fontSize="4xl"
            fontWeight="bold"
            color="primary"
            whiteSpace="pre-line"
          >
            {WEB_FIRST_CONTENT.TITLE}
          </Heading>
          <Text
            margin="0 !important"
            fontSize="lg"
            lineHeight={7}
            color="gray.900"
            whiteSpace={{ md: 'pre-line' }}
          >
            {WEB_FIRST_CONTENT.DESCRIPTION}
          </Text>
        </VStack>

        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
          templateRows={{ base: 'repeat(4, 550px)', md: '400px 500px 500px' }}
          w="full"
          gridGap={5}
        >
          {WEB_FIRST_CONTENT.LIST.map((item, index) => {
            const isMiddleItem = [1, 2].includes(index);
            const isFirst = index === 0;
            const isLast = index === WEB_FIRST_CONTENT.LIST.length - 1;
            return (
              <GridItem
                colSpan={isMiddleItem ? 1 : { base: 1, md: 2 }}
                key={index}
                position="relative"
                overflow="hidden"
                pt={{ base: 9, lg: 12 }}
                px={{ base: 9, lg: 12 }}
                bg={item.COLOR + '.700'}
              >
                <Box
                  position="absolute"
                  left="0"
                  top="0"
                  w={isMiddleItem ? '500px' : index === 3 ? '620px' : '920px'}
                  h={isMiddleItem ? '500px' : index === 3 ? '620px' : '920px'}
                  clipPath="polygon(0% 0%, 100% 0%, 0% 100%)"
                  bg={item.COLOR + (index === 3 ? '.600' : '.500')}
                  zIndex={0}
                />
                <Stack
                  direction="column"
                  as="article"
                  position="relative"
                  zIndex={1}
                  w="full"
                  h="full"
                  align="start"
                  gap={10}
                >
                  <VStack align="start" color="white" w="full" h="full">
                    {React.cloneElement(item.ICON, {
                      size: 36,
                      style: { minHeight: 36 },
                    })}
                    <Flex
                      direction={{
                        md: isFirst ? 'row' : 'column',
                        base: 'column',
                      }}
                      h="full"
                      gap="10"
                      maxW="100%"
                    >
                      <VStack align={'start'} h="full" maxW="container.lg">
                        <Heading as="h3" fontWeight={600} fontSize="4xl">
                          {item.TITLE}
                        </Heading>
                        <Text color="white" fontSize="xl">
                          {item.DESCRIPTION}
                        </Text>
                      </VStack>
                      {isMobile || isMiddleItem ? (
                        <Box
                          mr="-48px"
                          w={isLast ? 'calc(100% + 100px)' : undefined}
                          ml={isLast ? '-48px' : undefined}
                        >
                          <img
                            src={item.IMAGE_URL}
                            alt={item.TITLE}
                            style={{
                              objectFit: 'cover',
                              objectPosition: 'left top',
                            }}
                          />
                        </Box>
                      ) : (
                        <>
                          {isFirst && (
                            <Box w={item.IMAGE_WIDTH} position="relative">
                              <img
                                src={item.IMAGE_URL}
                                width={item.IMAGE_WIDTH}
                                alt={item.TITLE}
                                style={{
                                  objectFit: 'contain',
                                  objectPosition: isLast
                                    ? 'center top'
                                    : undefined,
                                }}
                              />
                            </Box>
                          )}
                          {isLast && (
                            <Box
                              w="calc(100%+100px)"
                              position="relative"
                              ml="-48px"
                              mr="-48px"
                            >
                              <img
                                src={item.IMAGE_URL}
                                width={item.IMAGE_WIDTH}
                                alt={item.TITLE}
                                style={{
                                  minHeight: '300px',
                                  maxWidth: '2000px !important',
                                  objectFit: 'contain',
                                  objectPosition: isLast
                                    ? 'center top'
                                    : undefined,
                                }}
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </Flex>
                  </VStack>
                </Stack>
              </GridItem>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

const Features = memo(() => {
  const [isLargerThan600] = useMediaQuery('(min-width: 600px)');
  return (
    <Box
      as="section"
      aria-label="features"
      w="full"
      py={{ base: '52px', md: '9rem' }}
      position="relative"
      bg="brandGray.100"
    >
      <Container
        id="features-content"
        margin="0 auto"
        gap={5}
        flexDir="column"
        alignItems="start"
        maxW="container.xl"
        w="full"
      >
        <VStack as="article" align="start" gap={3} pb={10}>
          <Heading
            fontFamily="plaak"
            fontSize="4xl"
            fontWeight="bold"
            color={baseColors.brandOrange['500']}
            whiteSpace="pre-line"
          >
            {isLargerThan600
              ? FEATURES_CONTENT.TITLE
              : FEATURES_CONTENT.TITLE_SM}
          </Heading>
          <Text
            margin="0 !important"
            fontSize="lg"
            lineHeight={7}
            color="gray.900"
            whiteSpace={{ md: 'pre-line' }}
          >
            {FEATURES_CONTENT.DESCRIPTION}
          </Text>
          <Text
            margin="0 !important"
            fontSize="xl"
            color="brandOrange.500"
            fontWeight={600}
            whiteSpace={{ md: 'pre-line' }}
          >
            {FEATURES_CONTENT.SPAN}
          </Text>
        </VStack>

        <Grid
          as="ul"
          aria-label="features-list"
          w="full"
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          {FEATURES_CONTENT.LIST.map((feat, index) => (
            <GridItem
              key={index}
              as="li"
              aria-label={feat.title}
              display="flex"
              flexDirection="column"
              gap={0}
              background="white"
              height={['auto', '640px']}
            >
              <Box as="figure" w="full" height="342px" position="relative">
                <Image
                  src={feat.picture}
                  fill
                  style={{ objectFit: 'cover' }}
                  alt={feat.title}
                />
              </Box>
              <VStack
                as="article"
                align="start"
                aria-label="feature-info"
                w="full"
                p={10}
                justify="start"
                flex={1}
                gap={2}
              >
                <Heading
                  as="h3"
                  margin="0 !important"
                  fontSize="1.875rem"
                  color={feat.color}
                  fontWeight={600}
                >
                  {feat.title}
                </Heading>
                <Text margin="0 !important" fontSize="lg" color="gray.800">
                  {feat.description}
                </Text>
              </VStack>
            </GridItem>
          ))}
        </Grid>
      </Container>
    </Box>
  );
});

const AppletsGallery = () => {
  const [isLargerThan600] = useMediaQuery('(min-width: 600px)');
  const [isLargerThan880] = useMediaQuery('(min-width: 880px)');

  return (
    <Box
      as="section"
      aria-label="Applets Gallery"
      w="full"
      px={{ base: 6 }}
      pt={['52px', '100px']}
      pb={['100px', '148px']}
      position="relative"
      whiteSpace={{ md: 'pre-line' }}
      overflow="hidden"
      bg="white"
    >
      <Flex
        margin="0 auto"
        gap={20}
        direction="column"
        align="start"
        maxW="container.xl"
        position="relative"
        w="full"
      >
        <VStack as="article" align="start" gap={6} pb={10}>
          <Heading
            fontFamily="plaak"
            fontSize="4xl"
            fontWeight="bold"
            color={baseColors.purple['500']}
          >
            {APPLETS_GALERY_CONTENT.TITLE}
          </Heading>
          <Text
            margin="0 !important"
            fontSize="lg"
            lineHeight={7}
            color="gray.900"
          >
            {APPLETS_GALERY_CONTENT.DESCRIPTION}
          </Text>
        </VStack>

        <Carousel
          cellSpacing={16}
          style={{ marginLeft: '-8px' }}
          slideIndex={1}
          wrapAround
          renderBottomCenterControls={() => <></>}
          renderCenterLeftControls={() => <></>}
          renderCenterRightControls={() => <></>}
          renderBottomLeftControls={(ctrl) => (
            <Flex
              align="center"
              gap={3}
              position="absolute"
              bottom="-48px"
              color="gray.500"
            >
              <button aria-label="Previous slide" onClick={ctrl.previousSlide}>
                <FiArrowLeft size="24px" />
              </button>
              <button aria-label="Next slide" onClick={ctrl.nextSlide}>
                <FiArrowRight size="24px" />
              </button>
            </Flex>
          )}
          slideWidth={
            isLargerThan600 && !isLargerThan880
              ? 580 + 16
              : isLargerThan880
              ? 680 + 16
              : 320 + 16
          }
        >
          {APPLET_GALLERY_LIST.map((app) => (
            <VStack
              align="start"
              minH={{ base: '524px', lg: '520px' }}
              justify={{ base: 'space-between' }}
              key={app.slug}
              flexDirection={{ base: 'column', lg: 'column-reverse' }}
              gap={{ base: 4, md: 8, lg: 4 }}
            >
              <VStack
                as="article"
                aria-label="applet info"
                gap={2}
                align="start"
                maxW={{ base: '380px', lg: '480px' }}
                flex={{ base: 0, lg: 1 }}
                justify={{ base: 'space-between' }}
              >
                <HStack>
                  <Heading
                    as="h3"
                    fontSize="2xl"
                    fontWeight={600}
                    color="blackAlpha.800"
                  >
                    {app.title}
                  </Heading>
                  <Link
                    href={app.url}
                    target="_blank"
                    aria-label={`access ${app.slug} applet`}
                  >
                    <Icon as={HiArrowUpRight} />
                  </Link>
                </HStack>
                <Text
                  h="60px"
                  css={{ margin: 0 }}
                  fontSize="sm"
                  color="gray.600"
                >
                  {app.description}
                </Text>
              </VStack>
              <Box
                as="div"
                w="100%"
                pt={
                  isLargerThan600 && !isLargerThan880
                    ? '92%'
                    : isLargerThan880
                    ? '63.5%'
                    : '100%'
                }
                bg="brandGray.100"
                // padding={{ base: 8, lg: 20 }}
                border="1px solid"
                borderColor="gray.200"
                position="relative"
              >
                <Image
                  src={`/thumbs/${app.slug}/${
                    isLargerThan600 && !isLargerThan880
                      ? 'md'
                      : isLargerThan880
                      ? 'lg'
                      : 'sm'
                  }.svg`}
                  alt={app.slug}
                  fill
                  style={{
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    borderRadius: 'inherit',
                  }}
                />
              </Box>
            </VStack>
          ))}
        </Carousel>
      </Flex>
    </Box>
  );
};

const Batteries = memo(() => {
  return (
    <Box
      as="section"
      aria-label="Batteries"
      w="full"
      py={{ base: '52px', md: '9rem' }}
      px={{ base: 6 }}
      position="relative"
      overflow="hidden"
      bg="purple.50"
    >
      <Container
        margin="0 auto"
        gap={[4, 20]}
        flexDir="column"
        alignItems="start"
        maxW="container.xl"
        position="relative"
        w="full"
      >
        <VStack align="start" gap={6} pb={10}>
          <Heading
            fontFamily="plaak"
            fontSize="4xl"
            fontWeight="bold"
            color="purple.500"
          >
            {BATTERIES_CONTENT.TITLE}
          </Heading>
          <Text
            margin="0 !important"
            fontSize="lg"
            lineHeight={7}
            color="gray.900"
          >
            {BATTERIES_CONTENT.DESCRIPTION}
          </Text>
        </VStack>

        <Grid
          templateColumns={{ base: '1fr', lg: 'repeat(4, 1fr)' }}
          rowGap={10}
          columnGap={5}
          w="full"
        >
          {BATTERIES_CONTENT.LIST.map((btr) => (
            <GridItem
              key={btr.name}
              colSpan={1}
              as={Stack}
              flexDirection={{ base: 'row', lg: 'column' }}
              alignItems={{ base: 'center', lg: 'center' }}
              gap={5}
            >
              <Box as="span" color="purple.500">
                {btr.icon}
              </Box>
              <Stack
                direction="column"
                gap={2}
                align={{ base: 'start', lg: 'center' }}
              >
                <Heading
                  fontSize={{ base: 'xl', lg: '2xl' }}
                  fontWeight={{ base: 500, lg: 600 }}
                  color="purple.500"
                  textAlign={{ lg: 'center' }}
                >
                  {btr.name}
                </Heading>
                <Text
                  style={{ marginTop: '0px' }}
                  textAlign={{ lg: 'center' }}
                  color="gray.800"
                >
                  {btr.description}
                </Text>
              </Stack>
            </GridItem>
          ))}
        </Grid>
      </Container>
    </Box>
  );
});

const Headline = memo(() => {
  return (
    <Box
      as="section"
      aria-label="Headline"
      w="full"
      py={{ base: '52px', md: '9rem' }}
      px={{ base: 6 }}
      position="relative"
      overflow="hidden"
      bg="brandGray.100"
    >
      <Box
        position="absolute"
        left="0"
        top="0"
        w="0"
        h="0"
        borderBottom={['200px solid transparent', '750px solid transparent']}
        zIndex={0}
        borderLeft={['200px solid white', '750px solid white']}
      />

      <Box
        position="absolute"
        right="0"
        bottom="0"
        w="0"
        h="0"
        borderTop={['200px solid transparent', '750px solid transparent']}
        zIndex={0}
        borderRight={['200px solid white', '750px solid white']}
      />
      <Container
        as="section"
        flexDirection={{ base: 'column' }}
        w="full"
        position="relative"
        maxW="container.xl"
        overflow="hidden"
      >
        <Text fontSize="lg" fontWeight={600} color="gray.600" mb={6}>
          {HEADLINE_CONTENT.SPAN}
        </Text>

        <Text
          fontSize={['48px', '72px']}
          color="brandOrange.900"
          fontWeight={400}
          lineHeight={['60px', '78px']}
          whiteSpace={{ md: 'pre-line' }}
        >
          {'“Using Zipper knocked \n me off the top of the \n list for '}
          <Text as="span" color="brandOrange.500">
            {'most swear \n words'}
          </Text>{' '}
          {'in commit \n messages.”'}
        </Text>
      </Container>
    </Box>
  );
});

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

const HomePage: NextPageWithLayout = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics?.page('Marketing Site', 'Features');
  }, []);

  return (
    <>
      <Head>
        <link rel="canonical" href="https://zipper.dev/" />
      </Head>
      <AnalyticsHead />
      <Website mode="dark">
        <Website.Navbar mode="dark" links={{ component: NextLink }} />
        <Box
          display="flex"
          flexDir="column"
          alignItems="center"
          as="main"
          w="full"
          margin="0 auto"
        >
          <Hero />
          <WebFirst />
          <Features />
          <AppletsGallery />
          <Batteries />
          <Headline />
          <Website.Footer links={{ component: NextLink }} />
        </Box>
      </Website>
    </>
  );
};

HomePage.skipAuth = true;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: { hasUser: false } };
};

export default HomePage;
