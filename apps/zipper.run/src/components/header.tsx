import {
  Box,
  HStack,
  Link,
  Flex,
  useBreakpointValue,
  Divider,
  Heading,
  Button,
  Text,
  IconButton,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { HiOutlineChevronDown } from 'react-icons/hi';

import { ZipperSymbol } from '@zipper/ui';
import { HiOutlineUpload } from 'react-icons/hi';
import { AppInfo } from '@zipper/types';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import React from 'react';

const Header: React.FC<AppInfo> = ({ canUserEdit, name }) => {
  const { user } = useUser();

  return (
    <>
      <Flex as="header" pt="20px" maxW="full" minW="md" paddingX={10}>
        <HStack spacing={3} alignItems="center" flex={1} minW={0}>
          <Box height={4}>
            <ZipperSymbol style={{ maxHeight: '100%' }} />
          </Box>

          {user && user.organizationMemberships.length > 0 && (
            <>
              <Heading
                as="h1"
                size="md"
                whiteSpace="nowrap"
                fontWeight="light"
                color="gray.400"
              >
                /
              </Heading>
              <Box display="flex" flexDirection="row" alignItems="center">
                <NextLink href="#">
                  <Heading
                    as="h1"
                    size="md"
                    overflow="auto"
                    whiteSpace="nowrap"
                    fontWeight="medium"
                    color="neutral.800"
                  >
                    {user.organizationMemberships[0]?.organization.name}
                  </Heading>
                </NextLink>
                {user.organizationMemberships.length > 1 && (
                  <IconButton
                    aria-label="hidden"
                    icon={<HiOutlineChevronDown color="gray" />}
                    colorScheme="transparent"
                  />
                )}
              </Box>
            </>
          )}

          <Heading
            as="h1"
            size="md"
            whiteSpace="nowrap"
            fontWeight="light"
            color="gray.400"
          >
            /
          </Heading>
          <Box>
            <NextLink href="#">
              <Heading
                as="h1"
                size="md"
                overflow="auto"
                whiteSpace="nowrap"
                fontWeight="semibold"
                color="gray.800"
              >
                {name}
              </Heading>
            </NextLink>
          </Box>
        </HStack>
        <HStack>
          <Button
            colorScheme="gray"
            variant="ghost"
            display="flex"
            gap={2}
            fontWeight="medium"
          >
            <HiOutlineUpload />
            <Text>Share</Text>
          </Button>
          {canUserEdit && (
            <Button
              colorScheme="purple"
              variant="ghost"
              display="flex"
              gap={2}
              fontWeight="medium"
            >
              <HiOutlineUpload />
              <Text>Edit App</Text>
            </Button>
          )}

          {!user && <SignInButton />}
          <UserButton afterSignOutUrl="/" />
        </HStack>
      </Flex>
    </>
  );
};

export default Header;
