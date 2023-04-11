import {
  Box,
  HStack,
  Flex,
  Heading,
  Button,
  Text,
  useToast,
  useClipboard,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { getAppLink } from '@zipper/utils';
import { ZipperSymbol } from '@zipper/ui';
import { HiOutlineUpload, HiOutlinePencilAlt } from 'react-icons/hi';
import { AppInfo } from '@zipper/types';
import { UserButton, useUser } from '@clerk/nextjs';
import React from 'react';
import { useRouter } from 'next/router';

const duration = 1500;

const Header: React.FC<AppInfo & { fileName?: string; editUrl?: string }> = ({
  canUserEdit,
  name,
  slug,
  fileName,
  editUrl,
}) => {
  const router = useRouter();
  const toast = useToast();

  const { user } = useUser();
  const { onCopy } = useClipboard(`https://${getAppLink(slug)}`);

  const copyLink = async () => {
    onCopy();
    toast({
      title: 'App link copied',
      status: 'info',
      duration,
      isClosable: true,
    });
  };

  return (
    <>
      <Flex as="header" pt="20px" maxW="full" minW="md" paddingX={10}>
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
                fontWeight="semibold"
                color="gray.800"
              >
                {name}
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
            <Heading
              as="h1"
              size="md"
              overflow="auto"
              whiteSpace="nowrap"
              fontWeight="semibold"
              color="gray.800"
            >
              {fileName}
            </Heading>
          </Box>
        </HStack>
        <HStack>
          <Button
            colorScheme="gray"
            variant="ghost"
            display="flex"
            gap={2}
            fontWeight="medium"
            onClick={copyLink}
          >
            <HiOutlineUpload />
            <Text>Share</Text>
          </Button>
          {canUserEdit && editUrl && (
            <Button
              colorScheme="purple"
              variant="ghost"
              display="flex"
              gap={2}
              fontWeight="medium"
              onClick={() => {
                window.location.href = editUrl;
              }}
            >
              <HiOutlinePencilAlt />
              <Text>Edit App</Text>
            </Button>
          )}

          {!user && (
            <Button
              colorScheme="gray"
              variant="ghost"
              display="flex"
              fontWeight="medium"
              onClick={() => {
                router.push(`/sign-in`);
              }}
            >
              <Text>Sign In</Text>
            </Button>
          )}
          <UserButton afterSignOutUrl="/" />
        </HStack>
      </Flex>
    </>
  );
};

export default Header;
