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
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { baseColors, Website } from '@zipper/ui';
import { memo, useEffect } from 'react';
import { NextPageWithLayout } from './_app';
import Header from '~/components/header';
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
} from 'react-icons/fi';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import JoinBetaForm from '~/components/join-beta-form';
import { useAnalytics } from '~/hooks/use-analytics';
import { useRouter } from 'next/router';
import Link from 'next/link';

/* -------------------------------------------- */
/* Content                                      */
/* -------------------------------------------- */

const HERO_CONTENT = {
  TITLE: 'Forget about \n your toolchain',

  DESCRIPTION: `
    Turn Typescript functions into serverless web apps 
    Don't write a line of frontend, auth, or API code 
    Do everything in your browser - start immediately with no setup`,
  LIST: [
    {
      description: 'Turn Typescript functions into serverless web apps',
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

const FEATURES_CONTENT = {
  TITLE: 's/decisions/\ndeploys',

  DESCRIPTION: `Your project shouldn’t be held up by a hundred decisions about
  hosting, routing, storage, and more (half of which you have to
  rethink because these services don’t all work together </rant>).`,

  SPAN: `Zipper gives you all the scaffolding you need to start
  shipping immediately`,
  LIST: [
    {
      title: 'Instant deploys',
      color: baseColors.purple['500'],
      description:
        'Publish your code to a public facing URL with the click of a button.  ',
      interact: (
        <Image
          src="/layout/deploy.svg"
          fill
          style={{ objectFit: 'cover' }}
          alt="Deploy"
        />
      ),
    },
    {
      title: 'A simple web framework',
      color: baseColors.brandOrange['500'],
      description:
        'Every file that exports a `handler` function automatically becomes a route in your app. Pass inputs to your handler, get back an output. ',
      interact: (
        <Image
          src="/layout/handler.svg"
          fill
          style={{ objectFit: 'cover' }}
          alt="Deploy"
        />
      ),
    },
    {
      title: 'UI without any frontend code ',
      color: baseColors.blue['500'],
      description:
        'The inputs to your functions become forms to collect user input and the outputs get turned into a functional UI.	  ',
      interact: (
        <Image
          src="/layout/ui.svg"
          fill
          style={{ objectFit: 'cover' }}
          alt="Deploy"
        />
      ),
    },
    {
      title: 'API endpoints for every route',
      color: baseColors.purple['500'],
      description:
        'Every route accepts GET & POST requests that can be secured with bearer tokens. Perfect for receiving webhooks or integrating into other pieces of software.',
      interact: (
        <Image
          src="/layout/getpost.svg"
          fill
          style={{ objectFit: 'cover' }}
          alt="Deploy"
        />
      ),
    },
    {
      title: 'Built-in storage',
      color: baseColors.blue['500'],
      description:
        'Each applet has its own KV store for managing data across runs.   ',
      interact: (
        <Image
          src="/layout/storage.svg"
          fill
          style={{ objectFit: 'cover' }}
          alt="Deploy"
        />
      ),
    },
    {
      title: 'Authentication connectors ',
      color: baseColors.purple['500'],
      description:
        'Force users to sign in to other services (such as Slack or GitHub) before running your applet.',
      interact: (
        <Image
          src="/layout/auth.svg"
          fill
          style={{ objectFit: 'cover' }}
          alt="Deploy"
        />
      ),
    },
  ],
};

const APPLETS_GALERY_CONTENT = {
  TITLE: 'hello ${working code}',
  DESCRIPTION: `Chances are that the thing you need to build has already been thought through by
  someone else. Zipper’s applet directory lets you fork pre-built applications that you can
  immediately use or quickly customize to better suit your needs. If you don’t see what you’re 
  looking for, you can start from a blank file or have AI generate some code for you ✨.`,
};

const APPLET_GALLEYR_LIST = [
  {
    title: 'Slack Backlinker',
    description:
      "Easily reference important messages, threads, or documents with a click, keeping your team's communication organized and efficient.",
    slug: 'slack-backlinker',
  },
  {
    title: 'Team Bookmarks / Go Links',
    description:
      "Effortlessly access and share links in Slack using intuitive slash commands. Retrieve important URLs with speed and simplicity, enhancing your team's productivity and knowledge sharing.",
    slug: 'team-go-links',
  },
  {
    title: 'JSON Explorer',
    description:
      "Instantly fetch a repository's dependency list. Gain valuable insights into each package with real-time NPM statistics and automatically generated descriptions, helping you understand their role within your application.",
    slug: 'json-explorer',
  },
  {
    title: 'User Feedback Button',
    description:
      'Easily collect valuable feedback with this button, fostering communication and improving your product based on user insights.',
    slug: 'user-feedback-button',
  },
  {
    title: 'Airtable Expense Tracker',
    description:
      'Connect and automate expense management. This embed applet seamlessly integrates with your Airtable workspace, effortlessly handling new records and providing real-time financial insights.',
    slug: 'airtable-expense-tracker',
  },
  {
    title: 'In-product changelog',
    description:
      'Display updates, enhancements, and new features directly within your application, ensuring users stay in the loop and can make the most of your latest changes.',
    slug: 'in-product-changelog',
  },
  {
    title: 'Waitlist Manager',
    description:
      'Easily manage user registrations, track progress, and streamline communication to ensure a smooth experience for both you and your eager audience.',
    slug: 'waitlist-manager',
  },
  {
    title: 'Product Activity Notifications',
    description:
      'Stay in the know with real-time updates. Receive Slack notifications when someone surpasses predefined activity thresholds, keeping your team informed and engaged.',
    slug: 'product-activity-notifications',
  },
  {
    title: 'Incident Management Bot',
    description:
      'Your dedicated incident response assistant within Slack. This bot automates incident handling, sends real-time alerts, and guides your team through incident resolution directly in your Slack workspace.',
    slug: 'incident-managment-bot',
  },
  {
    title: 'Basic Knowledge Base',
    description:
      'Elevate your information hub. Access a foundational knowledge base enhanced with AI-driven responses, providing more accurate and dynamic answers to your queries.',
    slug: 'basic-knowledge-base',
  },
  {
    title: "What's the team listening to",
    description:
      "Sync your team's musical vibes. This app integrates with Spotify API to curate and share what your team is currently jamming to, fostering a shared musical experience within your workspace.",
    slug: 'what-team-listening-to',
  },
  {
    title: 'Natural language to crontab',
    description:
      'Transform human language into computer-readable crontab syntax with AI. Easily schedule tasks and automate processes by describing them in plain English, and let the AI convert them into precise crontab schedules.',
    slug: 'natural-language-contrab',
  },
  {
    title: 'Link Zendesk tickets to GitHub Issues',
    description:
      'ink Zendesk tickets directly to GitHub Issues. Streamline support and development workflows by seamlessly connecting customer inquiries with development tasks in GitHub.',
    slug: 'zendesk-tickets-github-issues',
  },
  {
    title: 'GitHub WIP tracker',
    description:
      'Keep tabs on work in progress. Monitor and manage your GitHub projects with ease, tracking the status of ongoing tasks and ensuring efficient project management.',
    slug: 'github-wip-tracker',
  },
  {
    title: 'Feature Flagging',
    description:
      'Implement feature flags to toggle functionalities on and off, allowing for flexible and controlled feature deployments within your application.',
    slug: 'feature-flagging',
  },
  {
    title: 'PagerDuty to Slack usergroup',
    description:
      'Synchronize PagerDuty alerts and notifications with Slack usergroups to ensure the right team members are informed and ready to act during incidents.',
    slug: 'sync-pagerduty-slack-usergroup',
  },
];

const BATERIES_CONTENT = {
  TITLE: 'Batteries included',

  DESCRIPTION: `Some days you just want to prototype something quickly to prove that it works, while the
   next day that same app needs to be production ready. Zipper provides all the tooling you
    require alongside your code so that your app can get the approval of IT and security easily.`,

  LIST: [
    {
      name: 'Scheduling',
      description:
        'Use our cron scheduler to run your applet on a regular basis.',
      icon: <FiCalendar size={40} />,
    },
    {
      name: 'Authentication',
      description:
        'Turn on auth and users will have to sign in via Zipper before accessing your applet.',
      icon: <FiKey size={40} />,
    },
    {
      name: 'Audit logs ',
      description:
        'See who’s been running an applet as well as who’s been changing the code.',
      icon: <FiBookOpen size={40} />,
    },
    {
      name: 'Integrations you control ',
      description:
        'Integrate into existing tools using official SDKs and our pre-written (but extensible) code.',
      icon: <FiSliders size={40} />,
    },
  ],
};

const HEADLINE_CONTENT = {
  SPAN: 'Overheard from some developers you definitely know:',
};

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

/* ------------------- Hero ------------------- */

const Hero = () => {
  // Animations
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

  return (
    <Box
      as="section"
      aria-label="hero-container"
      w="full"
      py={{ base: '52px', md: '9rem' }}
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
        <Flex gap={8} direction={{ base: 'column', md: 'row' }}>
          <VStack gap={5} w={['full', 'auto']} align="start">
            <Heading
              fontFamily="plaak"
              fontSize={['40px', '6xl']}
              fontWeight="normal"
              color={baseColors.blue['500']}
            >
              {HERO_CONTENT.TITLE}
            </Heading>
            {HERO_CONTENT.LIST.map((feat, index) => (
              <Flex key={index} align="center" gap={2}>
                <Box as="span" color="blue.500">
                  {feat.icon}
                </Box>
                <Text fontSize="lg" color="gray.800">
                  {feat.description}
                </Text>
              </Flex>
            ))}

            <JoinBetaForm />
          </VStack>
          <Box
            display="flex"
            position="relative"
            width={{ base: 'full', md: '535px' }}
            height={{ base: '50vh', md: '445px' }}
            as={motion.div}
          >
            <Box
              as={motion.div}
              position="absolute"
              top="0"
              left={{ base: '-25px', md: '0' }}
              width={{ md: '440px' }}
              height="330px"
              animate={box1Animation}
            >
              <Image
                src="/static/animation_code.png"
                width="440"
                height="330"
                alt="Hero App"
              />
            </Box>
            <Box
              as={motion.div}
              position="absolute"
              bottom="0"
              right={{ base: '-45px', md: '0' }}
              width={{ md: '440px' }}
              height="330px"
              animate={box2Animation}
            >
              <Image
                src="/static/animation_applet.png"
                width="440"
                height="330"
                alt="Hero App"
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
        </Flex>
      </Container>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody></ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
const Features = memo(() => (
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
          {FEATURES_CONTENT.TITLE}
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
              {feat.interact}
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
));

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
              ? 980 + 16
              : 320 + 16
          }
        >
          {APPLET_GALLEYR_LIST.map((app) => (
            <VStack
              align="start"
              as="li"
              minH={{ base: '524px', lg: '720px' }}
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
                <Heading as="h3" fontSize="2xl" fontWeight={600}>
                  {app.title}
                </Heading>
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
                w={{ base: '320px', sm: '580px', lg: '980px' }}
                h={{ base: '320px', sm: '534px', lg: '625px' }}
                bg="brandGray.100"
                padding={{ base: 8, lg: 20 }}
                border="1px solid"
                borderColor="gray.200"
                position="relative"
              >
                <Image
                  src={`thumbs/${app.slug}/${
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
      bg="gray.100"
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
            color={baseColors.blue['500']}
          >
            {BATERIES_CONTENT.TITLE}
          </Heading>
          <Text
            margin="0 !important"
            fontSize="lg"
            lineHeight={7}
            color="gray.900"
          >
            {BATERIES_CONTENT.DESCRIPTION}
          </Text>
        </VStack>

        <Grid
          templateColumns={['1fr', 'repeat(2, 1fr)']}
          rowGap={10}
          columnGap={5}
          w="full"
        >
          {BATERIES_CONTENT.LIST.map((btr) => (
            <GridItem
              key={btr.name}
              colSpan={1}
              as={Flex}
              align="start"
              gap={5}
            >
              <Box as="span" color="blue.500">
                {btr.icon}
              </Box>
              <VStack gap={2} color="gray.800" align="start">
                <Heading fontSize="xl" fontWeight={600}>
                  {btr.name}
                </Heading>
                <Text style={{ marginTop: '0px' }}>{btr.description}</Text>
              </VStack>
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
        borderBottom={{
          base: '200px solid transparent',
          lg: '800px solid transparent',
        }}
        zIndex={0}
        borderLeft={{ base: '200px solid white', lg: '800px solid white' }}
      />

      <Box
        position="absolute"
        right="0"
        bottom="0"
        w="0"
        h="0"
        borderTop={{
          base: '200px solid transparent',
          lg: '800px solid transparent',
        }}
        zIndex={0}
        borderRight={{ base: '200px solid white', lg: '800px solid white' }}
      />
      <Container
        as="section"
        gap={[6]}
        flexDirection={{ base: 'column' }}
        w="full"
        position="relative"
        maxW="container.xl"
        overflow="hidden"
      >
        <Text fontWeight={600} fontSize="lg" color="gray.600">
          {HEADLINE_CONTENT.SPAN}
        </Text>

        <Text
          fontSize={['48px', '72px']}
          color="gray.800"
          fontWeight={400}
          lineHeight={['60px', '78px']}
          whiteSpace={{ md: 'pre-line' }}
        >
          {'Using Zipper knocked \n me off the top of the list \n for '}
          <Text as="span" color="brandOrange.500">
            most swear words
          </Text>{' '}
          {'in \n commit messages.'}
        </Text>
      </Container>
    </Box>
  );
});

const BetaSection = () => {
  return (
    <Box
      bgColor={'indigo.600'}
      color="white"
      w="full"
      justifyContent="center"
      display="flex"
      p="4"
    >
      <Text
        fontWeight={'bold'}
        mr={2}
        display="flex"
        alignItems="center"
        gap="2"
      >
        <HiOutlineLightningBolt size={20} /> Zipper is in beta
      </Text>
      <Text>
        <Box as="span" textDecoration={'underline'}>
          <Link href="/auth/signin">Sign up now</Link>
        </Box>{' '}
        to be the first to get new features.
      </Text>
    </Box>
  );
};

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

const HomePage: NextPageWithLayout = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics?.page('Marketing Site', 'Features');
  }, []);

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
        <Hero />
        <Features />
        <AppletsGallery />
        <Bateries />
        <Headline />
        <Website.Footer links={{ component: NextLink }} />
      </Box>
    </Website>
  );
};

HomePage.header = (props) => {
  if (props.subdomain) return <Header showNav={false} />;
  return <Header />;
};

HomePage.skipAuth = true;

export default HomePage;
