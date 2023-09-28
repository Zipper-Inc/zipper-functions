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
  site?: SiteType;
};

const LINKS = {
  [SiteType.Home]: [
    { label: 'Features', href: '/home', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Docs', href: '/docs', external: true },
    { label: 'Blog', href: '/blog', external: false },
  ],
  [SiteType.Docs]: [
    { label: 'Docs', href: '/docs', external: true },
    { label: 'Features', href: '/home', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Blog', href: '/blog', external: false },
  ],
  [SiteType.Blog]: [
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Features', href: '/home', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Docs', href: '/docs', external: true },
  ],
};

export const WebSiteNavbar = ({ links, site = SiteType.Home }: Props) => {
  const linksObj = LINKS[site];

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
          color="gray.800"
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
        <Links data={linksObj} component={links?.component} displayActiveLink />
        <Button
          as={Link}
          href="/auth/signin"
          isExternal
          fontWeight={500}
          color="gray.600"
          bg="white"
          textDecoration="none"
          h="44px"
          variant="outline"
        >
          Sign In
        </Button>
      </HStack>

      <Box display={{ base: 'block', lg: 'none' }}>
        <NavDrawer />
      </Box>
    </Container>
  );
};
