import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiCode, FiPlay, FiShuffle } from 'react-icons/fi';
import { SmartFunctionOutput } from '../function-output/smart-function-output';
import { ZipperSymbol } from '../zipperSymbol';
import { LAYOUTS_ICONS } from './common/Layouts';
import { Links } from './common/Links';
import { WebSiteSubscriptionForm } from './common/Subscription';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const DEMO_DESCRIPTION = 'Quickly build interactive apps, just like this:';

const LINKS = {
  DEV: {
    SITE: [
      { href: '/home', label: 'Features', external: false },
      { href: '/about', label: 'About', external: false },
      { href: 'http://localhost:3003', label: 'Docs', external: true },
      { href: 'http://localhost:3004', label: 'Blog', external: true },
      { label: 'Careers', href: '/about', external: false },
      { label: 'About', href: '/about', external: false },
      { label: 'Contact', href: '/about', external: false },
      {
        label: 'Sign In',
        href: 'https://zipper.dev/auth/signin',
        external: true,
      },
    ],
    BLOG: [
      {
        href: 'http://localhost:3000/home',
        label: 'Features',
        external: true,
      },
      { href: 'http://localhost:3000/about', label: 'About', external: true },
      { href: 'http://localhost:3003', label: 'Docs', external: true },
      { href: '/', label: 'Blog', external: true },
      { label: 'Careers', href: 'http://localhost:3000/about', external: true },
      { label: 'About', href: 'http://localhost:3000/about', external: true },
      { label: 'Contact', href: 'http://localhost:3000/about', external: true },
      {
        label: 'Sign In',
        href: 'https://zipper.dev/auth/signin',
        external: true,
      },
    ],
  },

  PROD: {
    SITE: [
      { href: '/home', label: 'Features', external: false },
      { href: '/about', label: 'About', external: false },
      { href: 'https://zipper.docs', label: 'Docs', external: true },
      { href: 'https://zipper.blog', label: 'Blog', external: true },
      { label: 'Careers', href: '/about', external: false },
      { label: 'About', href: '/about', external: false },
      { label: 'Contact', href: '/about', external: false },
      {
        label: 'Sign In',
        href: 'https://zipper.dev/auth/signin',
        external: true,
      },
    ],
    BLOG: [
      { href: '/', label: 'Blog', external: true },
      {
        href: 'https://zipper.dev/home',
        label: 'Features',
        external: true,
      },
      { href: 'https://zipper.dev/home', label: 'About', external: true },
      { href: 'https://zipper.docs', label: 'Docs', external: true },
      { label: 'Careers', href: 'https://zipper.dev/about', external: true },
      { label: 'About', href: 'https://zipper.dev/about', external: true },
      { label: 'Contact', href: 'https://zipper.dev/about', external: true },
      {
        label: 'Sign In',
        href: 'https://zipper.dev/auth/signin',
        external: true,
      },
    ],
  },
};

const COLORS = {
  inputs: ['purple', 'blue', 'brandOrange'],
  params: {
    1: 'solid',
    2: 'bicolor',
    3: 'tricolor',
  },
};

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

const AppletDemo = () => {
  const [logoRAW, setLogoRAW] = useState(null);
  const [loading, setLoading] = useState(false);

  const [inputs, setInputs] = useState({
    layout: 'surprise-me',
    selectedColors: [] as string[],
  });

  const colorMode = useMemo(
    () =>
      COLORS.params[
        inputs.selectedColors.length as keyof typeof COLORS.params
      ] ?? 'surprise-me',
    [inputs.selectedColors],
  );

  const fetchLogoImage = async (event: FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const result = await fetch('https://zipper-logo.zipper.run/relay', {
      method: 'POST',
      body: JSON.stringify({
        layout: inputs.layout,
        colorMode,
        size: 6,
      }),
    }).then((res) => res.json());

    setLogoRAW(result);
    setLoading(false);
  };

  return (
    <Flex
      as="section"
      align="center"
      bg="purple.900"
      w="full"
      onSubmit={fetchLogoImage}
      gap={10}
      py={{ base: 20, lg: 24 }}
    >
      <Container as="main" maxW="container.xl" w="full" centerContent gap={10}>
        <Text fontSize="2xl" textAlign="center" fontWeight={600} color="white">
          {DEMO_DESCRIPTION}
        </Text>
        <Grid
          as="figure"
          w="full"
          gridTemplateColumns={{ lg: '1fr 380px' }}
          gap={10}
        >
          <Center
            as="figure"
            flex={1}
            h="full"
            minH="320px"
            border="1px"
            bg="purple.800"
          >
            {logoRAW && !loading ? (
              <SmartFunctionOutput result={logoRAW} level={0} tableLevel={0} />
            ) : (
              <Text textAlign="center" color="purple.300" fontWeight={500}>
                {loading
                  ? 'Generating the model...'
                  : "Select the pre-definitions to gen the Zipper's logo"}
              </Text>
            )}
          </Center>
          <VStack p={8} align="start" as="form" gap={5} bg="white" maxH="340px">
            <VStack align="start" gap={1}>
              <Text as="label" fontWeight={600} fontSize="sm">
                Colors
              </Text>
              <HStack>
                {COLORS.inputs.map((color) => {
                  const isActive = inputs.selectedColors.includes(color);
                  return (
                    <IconButton
                      aria-label={color}
                      size="md"
                      _active={{
                        bg: `${color}.500`,
                        color: 'white',
                      }}
                      isActive={isActive}
                      onClick={() => {
                        if (isActive) {
                          const updatedColors = inputs.selectedColors.filter(
                            (col) => col !== color,
                          );

                          setInputs((prevInputs) => ({
                            ...prevInputs,
                            selectedColors: updatedColors,
                          }));
                        } else {
                          setInputs((props) => ({
                            ...props,
                            selectedColors: [...props.selectedColors, color],
                          }));
                        }
                      }}
                      icon={<FiCheck />}
                      key={color}
                      as="span"
                      cursor="pointer"
                      borderRadius="full"
                      bg={`${color}.100`}
                      color={`${color}.500`}
                    />
                  );
                })}
                <IconButton
                  aria-label="color-shuffle"
                  _active={{
                    bg: 'gray.600',
                    color: 'white',
                  }}
                  size="md"
                  icon={<FiShuffle />}
                  isActive={inputs.selectedColors.length === 0}
                  onClick={() =>
                    setInputs((props) => ({ ...props, selectedColors: [] }))
                  }
                  as="span"
                  cursor="pointer"
                  borderRadius="full"
                  bg="gray.200"
                  color="gray.400"
                />
              </HStack>
            </VStack>

            <VStack align="start" gap={1}>
              <Text as="label" fontWeight={600} fontSize="sm">
                Configuration
              </Text>
              <HStack>
                {Object.entries(LAYOUTS_ICONS).map(([key, icon]) => (
                  <IconButton
                    aria-label={key}
                    _active={{
                      bg: 'gray.600',
                    }}
                    size="md"
                    isActive={inputs.layout === key}
                    onClick={() => setInputs({ ...inputs, layout: key })}
                    icon={icon}
                    key={key}
                    as="span"
                    cursor="pointer"
                    borderRadius="full"
                    bg="gray.200"
                    color="gray.400"
                  />
                ))}
                <IconButton
                  aria-label="layout-shuffle"
                  _active={{
                    bg: 'gray.600',
                  }}
                  size="md"
                  isActive={inputs.layout === 'surprise-me'}
                  icon={<FiShuffle />}
                  as="span"
                  onClick={() =>
                    setInputs({ ...inputs, layout: 'surprise-me' })
                  }
                  cursor="pointer"
                  borderRadius="full"
                  bg="gray.200"
                  color="gray.400"
                />
              </HStack>
            </VStack>
            <Button
              type="submit"
              display="flex"
              alignItems="center"
              gap={2}
              colorScheme="purple"
              size="lg"
              w="full"
              fontWeight={500}
            >
              <FiPlay /> Run
            </Button>
          </VStack>
          {/* <Applet /> */}
        </Grid>
        <Button
          as={Link}
          isExternal
          display="flex"
          target="_blank"
          align="center"
          gap={2}
          href="https://zipper.dev/zipper/zipper-logo/src/main.ts"
          fontWeight={500}
          colorScheme="brandOrange"
        >
          View source code <FiCode />
        </Button>
      </Container>
    </Flex>
  );
};

type Props = {
  links?: Partial<Parameters<typeof Links>[0]>;
};

export const WebSiteFooter = ({ links }: Props) => {
  const [URL, setURL] = useState('');

  useEffect(() => {
    setURL(typeof window !== 'undefined' ? window.location.href : '');
  }, []);

  const linksObj = {
    ENV: process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD',
    SITE: ['localhost:3000', 'zipper.dev'].some((el) => URL.includes(el))
      ? 'SITE'
      : 'BLOG',
  } as { ENV: keyof typeof LINKS; SITE: keyof (typeof LINKS)['DEV'] };

  return (
    <VStack align="center" as="footer" w="full">
      <AppletDemo />

      {/** footer nav */}
      <VStack
        as="section"
        p={['52px 24px', '100px 130px']}
        bgColor="neutral.100"
        w="full"
        align="center"
        mt="0 !important"
        position="relative"
      >
        <Box
          position="absolute"
          left="0"
          top="0"
          w="0"
          h="0"
          borderBottom="200px solid transparent"
          zIndex={0}
          borderLeft="200px solid white"
        />
        <Container
          as={Grid}
          zIndex={1}
          w="full"
          gridTemplateColumns={{ base: '1fr', lg: 'repeat(4, 1fr)' }}
          gridTemplateRows={['148px']}
          maxW="container.xl"
          justifyContent="space-between"
          gap={{ base: 10, lg: 5 }}
        >
          <VStack
            align="start"
            justify="space-between"
            as={GridItem}
            colSpan={1}
            h="full"
          >
            <ZipperSymbol fill="#1174CB" />
            <Text fontSize="xl" color="blue.600" fontWeight={600}>
              Built for people <br /> who like to ship
            </Text>
          </VStack>

          <HStack
            as={GridItem}
            colSpan={{ base: 1, lg: 2 }}
            aria-label="Quick links"
            gap={5}
          >
            <VStack
              as="ul"
              flex={1}
              h="full"
              justify="space-between"
              align="flex-start"
            >
              <Links
                data={LINKS[linksObj.ENV][linksObj.SITE].slice(0, 4)}
                component={links?.component}
                displayActiveLink={false}
              />
            </VStack>

            <VStack
              as="ul"
              flex={1}
              h="full"
              justify="space-between"
              align="flex-start"
            >
              <Links
                data={LINKS[linksObj.ENV][linksObj.SITE].slice(4, 9)}
                component={links?.component}
                displayActiveLink={false}
              />
            </VStack>
          </HStack>

          <VStack as={GridItem} colSpan={1} align="end" justify="space-between">
            <WebSiteSubscriptionForm gap={2} />
            <Text fontSize="xs" as="span" color="neutral.600">
              &copy; 2023 Zipper, Inc. All rights reserved.
            </Text>
          </VStack>
        </Container>
      </VStack>
    </VStack>
  );
};
