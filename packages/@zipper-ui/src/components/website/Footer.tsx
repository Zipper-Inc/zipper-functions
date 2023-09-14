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
import { initApplet } from '@zipper-inc/client-js';
import shuffle from 'lodash.shuffle';
import { BLUE, ORANGE, PURPLE } from '../../theme/theme';
import { FormEvent, useEffect, useState } from 'react';
import { FiCheck, FiCode, FiPlay, FiShuffle } from 'react-icons/fi';
import { SmartFunctionOutput } from '../function-output/smart-function-output';
import { ZipperSymbol } from '../zipperSymbol';
import { LAYOUTS_ICONS } from './common/Layouts';
import { Links, SiteType } from './common/Links';
import { WebSiteSubscriptionForm } from './common/Subscription';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const DEMO_DESCRIPTION = 'Quickly build interactive apps, just like this:';

const LINKS = {
  [SiteType.Home]: [
    { label: 'Features', href: '/home', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Docs', href: '/docs', external: true },
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Careers', href: '/about#careers', external: false },
    { label: 'Contact', href: '/about#contact', external: false },
    { label: 'Terms', href: '/terms', external: true },
    { label: 'Privacy', href: '/privacy', external: true },
  ],
  [SiteType.Docs]: [
    { label: 'Docs', href: '/docs', external: true },
    { label: 'Features', href: '/home', external: false },
    { label: 'Blog', href: '/blog', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Careers', href: '/about#careers', external: false },
    { label: 'Contact', href: '/about#contact', external: false },
    { label: 'Terms', href: '/terms', external: true },
    { label: 'Privacy', href: '/privacy', external: true },
  ],
  [SiteType.Blog]: [
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Features', href: '/home', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Docs', href: '/docs', external: true },
    { label: 'Careers', href: '/about#careers', external: false },
    { label: 'Contact', href: '/about#contact', external: false },
    { label: 'Terms', href: '/terms', external: true },
    { label: 'Privacy', href: '/privacy', external: true },
  ],
};

const COLORS = {
  purple: PURPLE,
  blue: BLUE,
  brandOrange: ORANGE,
};

type ColorChoice = keyof typeof COLORS;
const COLOR_CHOICES = Object.keys(COLORS) as ColorChoice[];

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

const AppletDemo = () => {
  const [logoRAW, setLogoRAW] = useState(null);
  const [loading, setLoading] = useState(false);

  const [inputs, setInputs] = useState({
    layout: 'random',
    selectedColors: [] as ColorChoice[],
  });

  const fetchLogoImage = async (event?: FormEvent) => {
    event?.preventDefault();

    setLoading(true);

    const selectedColorCount = inputs.selectedColors.length;
    let pattern = 'random';
    if (selectedColorCount === 1) pattern = 'solid';
    if (selectedColorCount === 2)
      pattern = shuffle([
        'bicolor',
        'bicolor-alt',
        'bicolor-stripes',
      ])[0] as string;
    if (selectedColorCount === 3)
      pattern = shuffle([
        'tricolor',
        'tricolor-alt',
        'tricolor-stripes',
      ])[0] as string;

    const result = await initApplet('zipper-logo').run({
      pattern,
      layout: inputs.layout,
      size: 5.25,
      overrideColors: inputs.selectedColors.map((k: ColorChoice) => COLORS[k]),
    });

    setLogoRAW(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogoImage();
  }, []);

  return (
    <Flex
      as="section"
      align="center"
      bg="purple.900"
      w="full"
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
          <Center as="figure" flex={1} minH="320px" bg="purple.800">
            {logoRAW && !loading ? (
              <SmartFunctionOutput result={logoRAW} level={0} tableLevel={0} />
            ) : (
              <Text textAlign="center" color="purple.300" fontWeight={500}>
                {loading
                  ? 'Rearranging colors and letters...'
                  : 'Generate a unique version of the Zipper logo'}
              </Text>
            )}
          </Center>
          <VStack p={8} align="start" as="form" gap={5} bg="white" maxH="340px">
            <VStack align="start" gap={1}>
              <Text as="label" fontWeight={600} fontSize="sm">
                Colors
              </Text>
              <HStack>
                {COLOR_CHOICES.map((color) => {
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
                    color: 'white',
                  }}
                  size="md"
                  isActive={inputs.layout === 'random'}
                  icon={<FiShuffle />}
                  as="span"
                  onClick={() => setInputs({ ...inputs, layout: 'random' })}
                  cursor="pointer"
                  borderRadius="full"
                  bg="gray.200"
                  color="gray.400"
                />
              </HStack>
            </VStack>
            <Button
              display="flex"
              alignItems="center"
              gap={2}
              colorScheme="purple"
              size="lg"
              w="full"
              fontWeight={500}
              onClick={fetchLogoImage}
            >
              <FiPlay /> Regenerate logo
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
          href="https://zipper.dev/zipper-inc/zipper-logo/src/main.ts"
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
  hideAppletDemo?: boolean;
  site?: SiteType;
};

export const WebSiteFooter = ({
  links,
  hideAppletDemo,
  site = SiteType.Home,
}: Props) => {
  const linksObj = LINKS[site];

  return (
    <VStack align="center" as="footer" w="full">
      {!hideAppletDemo && <AppletDemo />}

      {/** footer nav */}
      <VStack
        as="section"
        p={['52px 24px', '100px 130px']}
        bgColor="brandGray.100"
        w="full"
        align="center"
        mt="0 !important"
        position="relative"
      >
        {!hideAppletDemo && (
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
        )}
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
                data={linksObj.slice(0, 4)}
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
                data={linksObj.slice(4, 8)}
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
                data={linksObj.slice(9, 12)}
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
