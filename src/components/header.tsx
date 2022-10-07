import {
  Avatar,
  Box,
  ButtonGroup,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import * as React from 'react';
import {
  FiHelpCircle,
  FiMenu,
  FiSearch,
  FiBell,
  FiChevronRight,
} from 'react-icons/fi';
import { ZipperLogo } from './svg/zipper-logo';

export default function Header() {
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const shadowValue = useColorModeValue('sm', 'sm-dark');
  return (
    <Box as="header" pb={{ base: '10' }} px="100">
      <Box as="nav" bg="bg-surface" boxShadow={shadowValue}>
        <Box maxW="none" py="5">
          <Flex justify="space-between">
            <HStack spacing="4">
              <Box h="6">
                <Link href="/">
                  <ZipperLogo style={{ maxHeight: '100%' }} />
                </Link>
              </Box>
              <div>
                <FiChevronRight />
              </div>
              <div>Zlack</div>
              <Box px="8" />
              <Link>Gallery</Link>
              <Link>Learn</Link>
              <Link>Build</Link>
            </HStack>
            <HStack spacing="4"></HStack>
            {isDesktop ? (
              <HStack spacing="4">
                <ButtonGroup variant="ghost" spacing="1">
                  <IconButton
                    icon={<FiSearch fontSize="1.25rem" />}
                    aria-label="Search"
                  />
                  <IconButton
                    icon={<FiBell fontSize="1.25rem" />}
                    aria-label="Notifications"
                  />
                  <IconButton
                    icon={<FiHelpCircle fontSize="1.25rem" />}
                    aria-label="Help Center"
                  />
                </ButtonGroup>
                <Avatar
                  boxSize="10"
                  name="Yan Y Khan"
                  src="https://avatars.githubusercontent.com/u/88688590?s=64"
                />
              </HStack>
            ) : (
              <IconButton
                variant="ghost"
                icon={<FiMenu fontSize="1.25rem" />}
                aria-label="Open Menu"
              />
            )}
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
