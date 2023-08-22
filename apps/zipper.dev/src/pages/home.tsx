import { plakFont } from '~/utils/local-fonts';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  keyframes,
  Text,
  VStack,
} from '@chakra-ui/react';
import { baseColors } from '@zipper/ui';
import { memo, useEffect, useState } from 'react';
import { NextPageWithLayout } from './_app';
import Header from '~/components/header';

/* -------------------------------------------- */
/* Content                                      */
/* -------------------------------------------- */

const HERO_CONTENT = {
  TITLE: 'Forget about \n your toolchain',

  DESCRIPTION: `Zipper turns Typescript functions into serverless web apps. 
    UI, APIs, and auth all come standard.`,
};

const FEATURES_CONTENT = {
  TITLE: 's/decisions/deploys',

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
};

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

/* ------------------- Title ------------------ */

const SIZES = {
  sm: '36px',
  md: '48px',
  lg: '72px',
};

const Title = ({
  color = baseColors.gray['800'],
  size = 'lg',
  ..._props
}: Partial<React.HTMLAttributes<HTMLHeadingElement>> & {
  color?: string;
  size?: keyof typeof SIZES;
}) => {
  const props = {
    ..._props,
    className: plakFont.className,
    style: {
      textTransform: 'uppercase',
      fontWeight: size === 'lg' ? 400 : 600,
      fontFamily: 'Plaak 6 Trial',
      fontSize: SIZES[size],
      margin: 0,
      lineHeight: size === 'lg' ? '72px' : '40px',
      color: color,
      ..._props.style,
    },
  };

  return <h1 {...(props as any)} />;
};

/* ------------------- Hero ------------------- */

const PageHero = () => {
  const [allreadyLoaded, setAllreadyLoaded] = useState(false);

  const clipPathAni = keyframes`
    0% {
      clip-path: polygon(100% 100%, 100% 100%, 100% 100%);
    }

    100% {
      clip-path: polygon(100% 0%, 0% 100%, 100% 100%);
    }
  `;

  const clipPathHover = keyframes`
  0% {
    clip-path: polygon(100% 0%, 0% 100%, 100% 100%);
  }

  100% {
    clip-path: polygon(150% -400%, -400% 150%, 100% 100%);
  }
  `;

  useEffect(() => {
    setAllreadyLoaded(true);
  }, []);

  return (
    <Box
      as="section"
      aria-label="hero-container"
      w="full"
      py={{ base: '52px', md: '9rem' }}
      position="relative"
      whiteSpace={{ md: 'pre-line' }} //important for \n new lines
    >
      <Flex
        as="article"
        aria-label="hero-content"
        margin="0 auto"
        gap={8}
        flexDirection={['column', 'column', 'column', 'row']}
        align="center"
        maxW={{ md: 'container.xl' }}
        w="full"
        zIndex="10"
        position="relative"
      >
        <VStack gap={5} w={['full', 'auto']} zIndex="10" align="start">
          <Heading
            fontFamily="plaak"
            fontSize={['40px', '6xl']}
            fontWeight="normal"
            color={baseColors.blue['500']}
          >
            {HERO_CONTENT.TITLE}
          </Heading>
          <Text marginTop="0px" fontSize="xl" color="gray.700">
            {HERO_CONTENT.DESCRIPTION}
          </Text>

          <Flex as="form" align="center" gap={2}>
            <Input
              height="2.75rem"
              width={{ base: 'full', md: '20rem' }}
              borderRadius="8px"
              variant="outline"
              placeholder="Email address"
              borderColor="gray.300"
              fontSize="md"
              color="gray.500"
            />
            <Button
              height="2.75rem"
              minWidth="138px"
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
        <Box
          marginLeft="-20px"
          height={['280px', '480px']}
          width={{ base: 'full' }}
          flex={{ md: 1 }}
          background="url('/layout/hero_code.svg')"
          backgroundSize="contain"
          backgroundPosition={{ base: 'top left' }}
          backgroundRepeat="no-repeat"
          position="relative"
        >
          <Box
            height="full"
            width="full"
            position="absolute"
            zIndex={10}
            top="30px"
            right={['-20px', '-20px', '0px', '30px']}
            background="url('/layout/hero_app.svg')"
            backgroundSize="contain"
            backgroundRepeat="no-repeat"
            backgroundPosition="bottom right"
            clipPath="polygon(100% 0%, 0% 100%, 100% 100%)"
            transition="all 1s ease-in-out"
            _hover={{
              clipPath: 'polygon(150% -400%, -400% 150%, 100% 100%)',
              animation: `${clipPathHover} 1s ease-in-out`,
            }}
            animation={
              !allreadyLoaded ? `${clipPathAni} 2s ease-in-out` : undefined
            }
          />
        </Box>
      </Flex>
    </Box>
  );
};

const Features = memo(() => (
  <Box
    as="section"
    aria-label="features"
    w="full"
    py="100px"
    position="relative"
    bg="brandGray.100"
    whiteSpace="pre-line" //important for \n new lines
  >
    <Flex
      id="features-content"
      margin="0 auto"
      gap={5}
      direction="column"
      align="start"
      maxW="container.xl"
      w="full"
    >
      <VStack as="article" align="start" gap={3} pb={10}>
        <Title color={baseColors.brandOrange['500']} size="sm">
          {FEATURES_CONTENT.TITLE}
        </Title>
        <Text
          margin="0 !important"
          fontSize="lg"
          lineHeight={7}
          color="gray.900"
        >
          {FEATURES_CONTENT.DESCRIPTION}
        </Text>
        <Text
          margin="0 !important"
          fontSize="xl"
          color="brandOrange.500"
          fontWeight={600}
        >
          {FEATURES_CONTENT.SPAN}
        </Text>
      </VStack>

      <Grid
        as="ul"
        aria-label="features-list"
        w="full"
        templateColumns="repeat(3, 1fr)"
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
            borderRadius={2}
            background="white"
            height="640px"
          >
            <Box as="figure" w="full" height="342px">
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
    </Flex>
  </Box>
));

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

const HomePage: NextPageWithLayout = () => (
  <Box
    display="flex"
    flexDir="column"
    alignItems="center"
    as="main"
    px={['24px', 0]}
    w="full"
    margin="0 auto"
  >
    <PageHero />
    {/* <Features /> */}
  </Box>
);

HomePage.header = (props) => {
  if (props.subdomain) return <Header showNav={false} />;
  return <Header />;
};

HomePage.skipAuth = true;

export default HomePage;
