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
import React, { useRef } from 'react';
import { FiMenu } from 'react-icons/fi';
import { ZipperLogo } from '../zipper-logo';
import { Links } from './common/Links';

type Props = {
  links?: Parameters<typeof Links>[0];
};

export const WebSiteNavbar = ({
  links = {
    data: [
      { href: '/feature', label: 'Feature' },
      { href: '/docs', label: 'Docs' },
      { href: '/blog', label: 'Blogs' },
      { href: '/about', label: 'About' },
    ],
    component: 'a',
  },
}: Props) => {
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
              <VStack mt={6} as="nav" gap={4}>
                {typeof window !== undefined && <Links {...links} />}
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
      <links.component href="/home">
        <ZipperLogo type="color" />
      </links.component>

      <HStack as="nav" display={['none', 'none', 'flex']} gap={8}>
        {typeof window !== undefined && <Links {...links} />}
        <Button colorScheme="gray" fontWeight={500} h="44px" variant="outline">
          Sign Up
        </Button>
      </HStack>

      <Box display={{ base: 'block', lg: 'none' }}>
        <NavDrawer />
      </Box>
    </Container>
  );
};
