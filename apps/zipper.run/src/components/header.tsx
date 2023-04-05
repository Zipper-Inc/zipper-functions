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
  Avatar as BaseAvatar,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import { ZipperSymbol } from '@zipper/ui';
import { HiOutlineUpload } from 'react-icons/hi';
import { AppInfo } from '@zipper/types';
import { useUser } from '@clerk/nextjs';

const Header: React.FC<AppInfo> = ({ canUserEdit }) => {
  // need to get user info
  const { user } = useUser();

  console.log('canUserEdit', canUserEdit);
  return (
    <>
      <Flex as="header" gap={4} pt="20px" maxW="full" minW="md" paddingX={10}>
        <HStack spacing={3} alignItems="center" flex={1} minW={0}>
          <Box height={4}>
            <ZipperSymbol style={{ maxHeight: '100%' }} />
          </Box>
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
                fontWeight="medium"
                color="neutral.800"
              >
                Sachin
              </Heading>
            </NextLink>
          </Box>
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
                Team Dashboard
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
          <BaseAvatar size="sm" src={user?.profileImageUrl || ''} />
        </HStack>
      </Flex>
    </>
  );
};

export default Header;
