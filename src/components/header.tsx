import {
  Avatar,
  Box,
  ButtonGroup,
  GridItem,
  HStack,
  IconButton,
  Link,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiHelpCircle, FiMenu, FiSearch, FiBell } from 'react-icons/fi';
import DefaultGrid from './default-grid';
import { ZipperLogo } from './svg/zipper-logo';

export default function Header() {
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  return (
    <DefaultGrid as="header" paddingY={12}>
      <GridItem colSpan={3}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <HStack spacing={3} height="100%">
            <Box height="4">
              <ZipperLogo style={{ maxHeight: '100%' }} />
            </Box>
            <Box fontWeight="bold" fontSize="xl">
              Functions
            </Box>
          </HStack>
        </Link>
      </GridItem>
      <GridItem colSpan={3} as="nav">
        <HStack
          height="100%"
          spacing={4}
          fontSize="lg"
          color="purple"
          textDecoration="none"
        >
          <Link>Gallery</Link>
          <Link>Learn</Link>
          <Link>Build</Link>
        </HStack>
      </GridItem>
      <GridItem colSpan={6} as="nav">
        {isDesktop ? (
          <HStack spacing="4" justifyContent="end">
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
      </GridItem>
    </DefaultGrid>
  );
}
