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
} from '@chakra-ui/react';
import React, { useEffect, useRef } from 'react';
import { FiMenu } from 'react-icons/fi';
import { ZipperLogo } from '../zipper-logo';
import { Links } from './common/Links';

type Props = {
  links?: Partial<Parameters<typeof Links>[0]>;
};

const LINKS = {
  DEV: {
    SITE: [
      { href: '/home', label: 'Features', external: false },
      { href: '/about', label: 'About', external: false },
      { href: 'http://localhost:3003', label: 'Docs', external: true },
      { href: 'http://localhost:3004', label: 'Blog', external: true },
    ],
    BLOG: [
      {
        href: 'http://localhost:3000/home',
        label: 'Features',
        external: true,
      },
      { href: 'http://localhost:3000/about', label: 'About', external: true },
      { href: 'http://localhost:3003', label: 'Docs', external: true },
      { href: '/blog', label: 'Blog', external: true },
    ],
  },

  PROD: {
    SITE: [
      { href: '/home', label: 'Features', external: false },
      { href: '/about', label: 'About', external: false },
      { href: 'https://zipper.docs', label: 'Docs', external: true },
      { href: 'https://zipper.blog', label: 'Blog', external: true },
    ],
    BLOG: [
      { href: '/blog', label: 'Blog', external: true },
      {
        href: 'https://zipper.dev/home',
        label: 'Features',
        external: true,
      },
      { href: 'https://zipper.dev/home', label: 'About', external: true },
      { href: 'https://zipper.docs', label: 'Docs', external: true },
    ],
  },
};

export const WebSiteNavbar = ({ links }: Props) => {
  const [URL, setURL] = React.useState('');

  useEffect(() => {
    setURL(typeof window !== 'undefined' ? window.location.href : '');
  }, []);

  const linksObj = {
    ENV: process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD',
    SITE: ['localhost:3000', 'zipper.dev'].some((el) => URL.includes(el))
      ? 'SITE'
      : 'BLOG',
  } as { ENV: keyof typeof LINKS; SITE: keyof (typeof LINKS)['DEV'] };

  const NavDrawer = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = useRef();

    return (
      <>
        <IconButton
          display={['flex', 'flex', 'none']}
          aria-label="menu"
          icon={<FiMenu size={24} />}
          ref={btnRef as any}
          colorScheme="gray"
          bg="none"
          onClick={onOpen}
        />

        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          finalFocusRef={btnRef as any}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            {/* <DrawerHeader>Create your account</DrawerHeader> */}

            <DrawerBody>
              <VStack mt={6} gap={4}>
                {typeof window !== undefined && (
                  <Links
                    data={LINKS[linksObj.ENV][linksObj.SITE]}
                    displayActiveLink
                    component={links?.component}
                  />
                )}
                <Button
                  colorScheme="gray"
                  fontWeight={500}
                  h="44px"
                  variant="outline"
                >
                  Sign Up
                </Button>
              </VStack>
            </DrawerBody>

            <DrawerFooter></DrawerFooter>
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
      h={{ base: '80px', lg: '125px' }}
      w="full"
      maxW="container.xl"
    >
      {links?.component && (
        <links.component href="/home">
          <ZipperLogo type="color" />
        </links.component>
      )}

      <HStack as="nav" display={['none', 'none', 'flex']} gap={8}>
        <Links
          data={LINKS[linksObj.ENV][linksObj.SITE]}
          component={links?.component}
          displayActiveLink
        />
        <Button
          as="nav"
          colorScheme="gray"
          fontWeight={500}
          h="44px"
          variant="outline"
        >
          Sign Up
        </Button>
      </HStack>

      <Box display={{ base: 'block', lg: 'none' }}>
        <NavDrawer />
      </Box>
    </Container>
  );
};
