import {
  HStack,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerOverlay,
  IconButton,
  useDisclosure,
  VStack,
  Box,
  Link,
} from '@chakra-ui/react';
import React, { useRef } from 'react';
import { FiMenu } from 'react-icons/fi';
import { ZipperLogo } from '../zipper-logo';
import { Links } from './common/Links';
import { SiteType } from './common/SiteType';

type Props = {
  links?: Partial<Parameters<typeof Links>[0]>;
  mode?: 'dark' | 'light';
  site?: SiteType;
};

const LINKS = {
  [SiteType.Home]: [
    { label: 'Gallery', href: '/gallery', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Changelog', href: '/changelog', external: false },
    { label: 'Docs', href: '/docs', external: true },
    { label: 'Blog', href: '/blog', external: false },
  ],
  [SiteType.Docs]: [
    { label: 'Home', href: '/home', external: false },
    { label: 'Gallery', href: '/gallery', external: false },
    { label: 'Docs', href: '/docs', external: true },
    { label: 'About', href: '/about', external: false },
    { label: 'Blog', href: '/blog', external: false },
  ],
  [SiteType.Blog]: [
    { label: 'Home', href: '/home', external: false },
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Gallery', href: '/gallery', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Docs', href: '/docs', external: true },
  ],
};

export const WebSiteNavbar = ({
  links,
  site = SiteType.Home,
  mode = 'light',
}: Props) => {
  const linksObj = LINKS[site];

  const NavDrawer = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = useRef<HTMLButtonElement | null>(null);

    return (
      <>
        <IconButton
          display={['flex', 'flex', 'none']}
          aria-label="menu"
          icon={<FiMenu size={24} />}
          ref={btnRef}
          color="gray.50"
          bg="none"
          onClick={onOpen}
        />

        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />

            <DrawerBody>
              <VStack mt={6} gap={4}>
                {typeof window !== undefined && (
                  <Links
                    data={linksObj}
                    displayActiveLink
                    component={links?.component}
                  />
                )}
                <Button
                  color="gray.600"
                  fontWeight={500}
                  h="44px"
                  variant="outline"
                >
                  Sign In
                </Button>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  };

  return (
    <Container
      as="header"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      css={{ margin: '0 auto' }}
      h={{ base: '80px', lg: '124px' }}
      w="full"
      maxW="container.xl"
    >
      {links?.component && (
        <links.component href="/home" aria-label="home">
          <ZipperLogo type={mode === 'dark' ? 'dark' : 'color'} />
        </links.component>
      )}

      <HStack as="nav" display={['none', 'none', 'flex']} gap={8}>
        <Links
          data={linksObj}
          mode={mode}
          component={links?.component}
          displayActiveLink
        />
        <Button
          as={Link}
          href="/auth/signin"
          isExternal
          fontWeight={500}
          bg="white"
          color="purple.500"
          textDecoration="none"
          h="44px"
          variant="outline"
        >
          Sign In
        </Button>
      </HStack>

      <Box display={{ base: 'block', md: 'none' }}>
        <NavDrawer />
      </Box>
    </Container>
  );
};
