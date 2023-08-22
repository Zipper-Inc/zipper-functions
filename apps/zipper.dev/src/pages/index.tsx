import Carousel from 'nuka-carousel';
import { createSSGHelpers } from '@trpc/react/ssg';
import { GetServerSideProps } from 'next';
import { Gallery } from '~/components/gallery';
import { createContext } from '~/server/context';
import { getValidSubdomain, removeSubdomains } from '~/utils/subdomains';
import { NextPageWithLayout } from './_app';
import { trpcRouter } from '~/server/routers/_app';
import { plakFont } from '~/utils/local-fonts';
import { inferQueryOutput, trpc } from '~/utils/trpc';
import { baseColors, useEffectOnce } from '@zipper/ui';
import SuperJSON from 'superjson';
import { useRouter } from 'next/router';
import Header from '~/components/header';
import { useUser } from '~/hooks/use-user';
import { getToken } from 'next-auth/jwt';
import { authOptions } from './api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiKey,
  FiSliders,
} from 'react-icons/fi';
import Footer from '~/components/footer';

export type GalleryAppQueryOutput = inferQueryOutput<
  'app.allApproved' | 'app.byResourceOwner'
>;

const IndexPage: NextPageWithLayout = (props) => {
  const features = useMemo(
    () => [
      {
        title: 'Instant deploys',
        color: baseColors.purple['500'],
        description:
          'Publish your code to a public facing URL with the click of a button.  ',
        interact: <h1>hello</h1>,
      },
      {
        title: 'A simple web framework',
        color: baseColors.brandOrange['500'],
        description:
          'Every file that exports a `handler` function automatically becomes a route in your app. Pass inputs to your handler, get back an output. ',
        interact: <h1>hello</h1>,
      },
      {
        title: 'UI without any frontend code ',
        color: baseColors.blue['500'],
        description:
          'The inputs to your functions become forms to collect user input and the outputs get turned into a functional UI.	  ',
        interact: <h1>hello</h1>,
      },
      {
        title: 'API endpoints for every route',
        color: baseColors.purple['500'],
        description:
          'Every route accepts GET & POST requests that can be secured with bearer tokens. Perfect for receiving webhooks or integrating into other pieces of software.',
        interact: <h1>hello</h1>,
      },
      {
        title: 'Built-in storage',
        color: baseColors.blue['500'],
        description:
          'Each applet has its own KV store for managing data across runs.   ',
        interact: <h1>hello</h1>,
      },
      {
        title: 'Authentication connectors ',
        color: baseColors.purple['500'],
        description:
          'Force users to sign in to other services (such as Slack or GitHub) before running your applet.',
        interact: <h1>hello</h1>,
      },
    ],
    [],
  );

  type GalleryApp = {
    name: string;
    description: string;
    slug: string;
    resourceOwner: {
      slug: string;
    };
    iconUrl: string;
  };

  const galleryApps = [
    {
      name: 'Natural language to crontab',
      description:
        'Converts natural language to crontab syntax. Used on the Schedules tab in Zipper to make it easier to schedule applet runs. ',
      slug: 'crontab-ai-generator',
      resourceOwner: { slug: 'zipper' },
      iconUrl:
        'https://source.boringavatars.com/bauhaus/120/crontab-ai-generator?colors=9B2FB4,651D78,EC4A0A,E3E2E1,white&square',
    },
    {
      name: 'Package JSON Explorer',
      description:
        'An applet that returns useful stuff about the project dependencies of your project',
      slug: 'package-json-explorer',
      resourceOwner: { slug: 'zipper' },
      iconUrl:
        'https://source.boringavatars.com/bauhaus/120/package-json-explorer?colors=9B2FB4,651D78,EC4A0A,E3E2E1,white&square',
    },
    {
      name: 'Slack Timezone Converter Bot',
      description:
        "Uses AI to convert times in Slack messages to a set of timezones that covers our team's needs.",
      slug: 'slack-timezone-converter',
      resourceOwner: { slug: 'sachin' },
      iconUrl:
        'https://source.boringavatars.com/bauhaus/120/slack-timezone-converter?colors=9B2FB4,651D78,EC4A0A,E3E2E1,white&square',
    },
    {
      name: 'Feature Flags Example',
      description: 'A simple feature flagging system implemented in Zipper.',
      slug: 'feature-flags-example',
      resourceOwner: { slug: 'zipper' },
      iconUrl:
        'https://source.boringavatars.com/bauhaus/120/feature-flags-example?colors=9B2FB4,651D78,EC4A0A,E3E2E1,white&square',
    },
    {
      name: 'Status Page Example',
      description:
        'An example status page applet that could be used to communicate open incidents for internal services.',
      slug: 'status-page-example',
      resourceOwner: { slug: 'zipper' },
      iconUrl:
        'https://source.boringavatars.com/bauhaus/120/status-page-example?colors=9B2FB4,651D78,EC4A0A,E3E2E1,white&square',
    },
  ];

  const batteries = useMemo(
    () => [
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
    [],
  );
  // const router = useRouter();
  // const { user, isLoaded } = useUser();

  // const appsByResourceOwnerQuery = trpc.useQuery(
  //   ['app.byResourceOwner', { resourceOwnerSlug: props.subdomain as string }],
  //   {
  //     enabled: !!props.subdomain,
  //   },
  // );

  // const galleryAppsQuery = trpc.useQuery(['app.allApproved'], {
  //   enabled: !props.subdomain && !user,
  // });

  // if (props.subdomain && appsByResourceOwnerQuery.isSuccess) {
  //   return <Gallery apps={appsByResourceOwnerQuery.data} />;
  // }

  // if (isLoaded && !user && galleryAppsQuery.isSuccess) {
  //   return (
  //     <Gallery
  //       apps={galleryAppsQuery.data}
  //       heading="Popular Applets"
  //       subheading="Browse popular internal tools being built on Zipper"
  //     />
  //   );
  // }

  // if (user) {
  //   router.push('/dashboard');
  // }

  return (
    <Box w="full">
      <Box w="full" py="9rem" position="relative">
        <Flex
          margin="0 auto"
          gap={8}
          align="center"
          maxW="container.xl"
          w="full"
          zIndex="10"
          position="relative"
        >
          <VStack gap={5} w="auto" zIndex="10" align="start">
            <h1
              className={plakFont.className}
              style={{
                textTransform: 'uppercase',
                fontWeight: 400,
                fontFamily: 'Plaak 6 Trial',
                fontSize: '4rem',
                margin: 0,
                lineHeight: '72px',
                color: '#1789DC',
              }}
            >
              Forget about <br /> your toolchain
            </h1>
            <Text marginTop="0px" fontSize="xl" color="gray.700">
              Zipper turns Typescript functions into serverless web apps. <br />{' '}
              UI, APIs, and auth all come standard.
            </Text>
            <Flex align="center" gap={2}>
              <Input
                height="2.75rem"
                width="20rem"
                borderRadius="8px"
                variant="outline"
                placeholder="Email address"
                borderColor="gray.300"
                fontSize="md"
                color="gray.500"
              />
              <Button
                height="2.75rem"
                fontSize="md"
                borderRadius="8px"
                bg="brandOrange.500"
                padding="10px 18px"
                color="white"
                fontWeight={500}
                _hover={{ background: 'brandOrange.700' }}
              >
                Join the beta
              </Button>
            </Flex>
          </VStack>
          <Box height="430px" flex={1} bg="red" />
        </Flex>
      </Box>

      <Box w="full" py="24" position="relative" bg="brandGray.100">
        <Flex
          margin="0 auto"
          gap={5}
          direction="column"
          align="start"
          maxW="container.xl"
          w="full"
        >
          <VStack align="start" gap={3} pb={10}>
            <h1
              className={plakFont.className}
              style={{
                textTransform: 'uppercase',
                fontWeight: 600,
                fontFamily: 'Plaak 6 Trial',
                fontSize: '2.25rem',
                margin: 0,
                lineHeight: '40px',
                color: baseColors.brandOrange['500'],
              }}
            >
              s/decisions/deploys
            </h1>
            <Text
              margin="0 !important"
              fontSize="lg"
              lineHeight={7}
              color="gray.900"
            >
              Your project shouldn’t be held up by a hundred decisions about
              <br />
              {
                'hosting, routing, storage, and more (half of which you have to'
              }{' '}
              <br />
              {
                'rethink because these services don’t all work together </rant>).'
              }
            </Text>
            <Text
              margin="0 !important"
              fontSize="xl"
              color="brandOrange.500"
              fontWeight={600}
            >
              Zipper gives you all the scaffolding you need to start <br />{' '}
              shipping immediately:
            </Text>
          </VStack>

          <Grid w="full" templateColumns="repeat(3, 1fr)" gap={4}>
            {features.map((feat, index) => (
              <GridItem
                key={index}
                as={Flex}
                flexDirection="column"
                gap={0}
                rows={2}
                borderRadius={2}
                background="white"
                height="640px"
              >
                <Box as="figure" w="full" height="342px">
                  {feat.interact}
                </Box>
                <VStack
                  align="start"
                  w="full"
                  p={10}
                  justify="start"
                  flex={1}
                  gap={2}
                >
                  <Heading
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
        </Flex>
      </Box>

      <Box w="full" pt="100px" pb="148px" position="relative" overflow="hidden">
        <Flex
          margin="0 auto"
          gap={20}
          direction="column"
          align="start"
          maxW="container.xl"
          position="relative"
          w="full"
        >
          <VStack align="start" gap={6} pb={10}>
            <h1
              className={plakFont.className}
              style={{
                textTransform: 'uppercase',
                fontWeight: 600,
                fontFamily: 'Plaak 6 Trial',
                fontSize: '2.25rem',
                margin: 0,
                lineHeight: '40px',
                color: baseColors.purple['500'],
              }}
            >
              {'hello ${working code}'}
            </h1>
            <Text
              margin="0 !important"
              fontSize="lg"
              lineHeight={7}
              color="gray.900"
            >
              Chances are that the thing you need to build has already been
              thought through by <br /> someone else. Zipper’s applet directory
              lets you fork pre-built applications that you can <br />{' '}
              immediately use or quickly customize to better suit your needs. If
              you don’t see what you’re <br /> looking for, you can start from a
              blank file or have AI generate some code for you ✨.
            </Text>
          </VStack>

          <Carousel
            // slidesToShow={4.25}
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
                <button
                  aria-label="Previous slide"
                  onClick={ctrl.previousSlide}
                >
                  <FiArrowLeft size="24px" />
                </button>
                <button aria-label="Next slide" onClick={ctrl.nextSlide}>
                  <FiArrowRight size="24px" />
                </button>
              </Flex>
            )}
            slideWidth={380 + 16}
          >
            {galleryApps?.map((app) => (
              <VStack align="start" key={app.slug} gap={2}>
                <Heading as="h3" fontSize="2xl" fontWeight={600}>
                  {app.name}
                </Heading>
                <Text
                  h="60px"
                  css={{ margin: 0 }}
                  fontSize="sm"
                  color="gray.600"
                >
                  {app.description}
                </Text>
                <Box w="380px" borderRadius="8px" h="380px" bg="gray.100" />
              </VStack>
            ))}
          </Carousel>
        </Flex>
      </Box>

      <Box w="full" py="24" position="relative" overflow="hidden" bg="gray.100">
        <Flex
          margin="0 auto"
          gap={20}
          direction="column"
          align="start"
          maxW="container.xl"
          position="relative"
          w="full"
        >
          <VStack align="start" gap={6} pb={10}>
            <h1
              className={plakFont.className}
              style={{
                textTransform: 'uppercase',
                fontWeight: 600,
                fontFamily: 'Plaak 6 Trial',
                fontSize: '2.25rem',
                margin: 0,
                lineHeight: '40px',
                color: baseColors.blue['500'],
              }}
            >
              {'Bateries included'}
            </h1>
            <Text
              margin="0 !important"
              fontSize="lg"
              lineHeight={7}
              color="gray.900"
            >
              Some days you just want to prototype something quickly to prove
              that it works, while the <br /> next day that same app needs to be
              production ready. Zipper provides all the tooling you <br />{' '}
              require alongside your code so that your app can get the approval
              of IT and security <br /> easily.  
            </Text>
          </VStack>

          <Grid
            templateColumns="repeat(2, 1fr)"
            rowGap={10}
            columnGap={5}
            w="full"
          >
            {batteries.map((btr) => (
              <GridItem colSpan={1} as={Flex} align="start" gap={5}>
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
        </Flex>
      </Box>
      <Footer />
    </Box>
  );
};

// export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
//   const { host } = req.headers;

//   // validate subdomain
//   const subdomain = getValidSubdomain(host);
//   const session = await getServerSession(req, res, authOptions);

//   const ssg = createSSGHelpers({
//     router: trpcRouter,
//     transformer: SuperJSON,
//     ctx: await createContext({ req, res }),
//   });

//   if (subdomain) {
//     try {
//       await ssg.fetchQuery('app.byResourceOwner', {
//         resourceOwnerSlug: subdomain,
//       });
//     } catch (e) {
//       return {
//         redirect: {
//           destination: `${
//             process.env.NODE_ENV === 'production' ? 'https' : 'http'
//           }://${removeSubdomains(host!)}`,
//         },
//         props: {},
//       };
//     }

//     return {
//       props: {
//         trpcState: ssg.dehydrate(),
//         subdomain,
//       },
//     };
//   }

//   if (session?.user) {
//     await ssg.fetchQuery('app.byAuthedUser');

//     return {
//       props: {
//         trpcState: ssg.dehydrate(),
//       },
//     };
//   }

//   await ssg.fetchQuery('app.allApproved');

//   return { props: { trpcState: ssg.dehydrate() } };
// };

IndexPage.header = (props) => {
  if (props.subdomain) return <Header showNav={false}></Header>;
  return <Header></Header>;
};

IndexPage.skipAuth = true;

export default IndexPage;
