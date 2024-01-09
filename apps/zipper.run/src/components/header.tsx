import {
  Box,
  HStack,
  Heading,
  Button,
  Text,
  useToast,
  useClipboard,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Divider,
  Container,
  useMediaQuery,
  Flex,
} from '@chakra-ui/react';
import { getAppLink, getZipperDotDevUrl, removeExtension } from '@zipper/utils';
import { BLUE, useEffectOnce, ZipperSymbol } from '@zipper/ui';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { MdLogin } from 'react-icons/md';
import { AppInfo, EntryPointInfo } from '@zipper/types';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { FiChevronDown, FiChevronUp, FiLink } from 'react-icons/fi';
import { readJWT } from '~/utils/get-zipper-auth';

import Image from 'next/image';
import { PiSignOutDuotone } from 'react-icons/pi';

const duration = 1500;

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

export type HeaderProps = AppInfo & {
  entryPoint?: EntryPointInfo;
  runnableScripts?: string[];
  runId?: string;
  setScreen: (screen: 'initial' | 'output') => void;
  setLoading: (value: boolean) => void;
  token?: string;
};

const Header: React.FC<HeaderProps> = ({
  canUserEdit,
  name,
  slug,
  entryPoint,
  runnableScripts = [],
  runId,
  setLoading,
  token,
}) => {
  const router = useRouter();
  const toast = useToast();
  const { onCopy, setValue } = useClipboard('');
  const [user, setUser] = useState<Record<string, string> | undefined>();
  const [isMobileView] = useMediaQuery('(max-width: 600px)');

  useEffectOnce(() => {
    if (token) {
      setUser(readJWT(token));
    }
  });

  useEffect(() => {
    const baseUrl = `${protocol}://${getAppLink(slug)}`;
    if (runId) {
      setValue(`${baseUrl}/run/history/${runId}`);
    } else {
      setValue(baseUrl);
    }
  }, [runId]);

  const copyLink = async () => {
    onCopy();
    toast({
      title: 'App link copied',
      status: 'info',
      duration,
      isClosable: true,
    });
  };

  if (!entryPoint) {
    return <></>;
  }

  const entryPointName = useMemo(
    () => removeExtension(entryPoint.filename),
    [entryPoint],
  );

  /* -------------------------------------------- */
  /* Components                                   */
  /* -------------------------------------------- */

  const AppletPaths = () => (
    <Box>
      {runnableScripts.length > 1 ? (
        <Menu>
          {({ isOpen, onClose }) => (
            <>
              <MenuButton
                as={isMobileView ? Button : undefined}
                variant={{ base: 'outline', md: undefined }}
              >
                <HStack>
                  <Text
                    fontFamily="heading"
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight="semibold"
                    color="fg.800"
                  >
                    {entryPointName}
                  </Text>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </HStack>
              </MenuButton>
              <MenuList pb={0}>
                <Box pb="4" pt="2" px={4}>
                  <Link
                    fontSize="sm"
                    fontWeight="medium"
                    onClick={() => {
                      onClose();
                      setLoading(true);
                      router.push(`/${entryPoint.filename}`);
                    }}
                    _hover={{ background: 'none' }}
                  >
                    {entryPointName}
                  </Link>
                </Box>

                <Divider />
                <Box
                  w="full"
                  backgroundColor={'fg.50'}
                  backdropFilter="blur(10px)"
                  pl="4"
                  pt="5"
                  fontSize="xs"
                >
                  <Text>Other paths:</Text>
                </Box>
                {runnableScripts
                  .filter((filename) => filename !== entryPoint.filename)
                  .sort()
                  .map((filename, i) => {
                    return (
                      <MenuItem
                        key={`${filename}-${i}`}
                        onClick={() => {
                          onClose();
                          setLoading(true);
                          router.push(`/${filename}`);
                        }}
                        backgroundColor="fg.50"
                        px="4"
                        pt="2"
                        fontWeight="medium"
                        fontSize="sm"
                        _last={{
                          pb: 4,
                        }}
                      >
                        {removeExtension(filename)}
                      </MenuItem>
                    );
                  })}
              </MenuList>
            </>
          )}
        </Menu>
      ) : (
        <Heading
          as="h1"
          size="md"
          overflow="auto"
          whiteSpace="nowrap"
          fontWeight="semibold"
          color="fg.800"
          _hover={{ cursor: 'pointer' }}
          onClick={() => {
            window.location.replace('/');
          }}
        >
          {entryPoint.filename.replace(/\.ts$/, '')}
        </Heading>
      )}
    </Box>
  );

  const AppletActions = () => (
    <HStack gap={0}>
      <Button
        variant="ghost"
        display="flex"
        size="sm"
        gap={2}
        fontWeight="medium"
        onClick={copyLink}
      >
        <FiLink />
        <Text>Copy Link</Text>
      </Button>

      {canUserEdit && entryPoint.editUrl && (
        <Button
          variant="outline"
          display="flex"
          size="sm"
          fontWeight="medium"
          onClick={() => {
            window.location.href = entryPoint.editUrl;
          }}
          leftIcon={<HiOutlinePencilAlt />}
        >
          <Text>Edit App</Text>
        </Button>
      )}
    </HStack>
  );

  /* -------------------------------------------- */
  /* Render¸                                      */
  /* -------------------------------------------- */

  return (
    <>
      <Container
        as="header"
        maxW="full"
        pt="20px"
        minW="md"
        px={{ base: '4', md: '10' }}
        justifyContent="center"
      >
        <HStack
          justify="space-between"
          spacing={3}
          alignItems="center"
          flex={1}
          minW={0}
        >
          <HStack spacing={4}>
            <Link href={getZipperDotDevUrl().origin}>
              <HStack spacing={2}>
                <ZipperSymbol
                  fill={BLUE}
                  middle={{ fill: BLUE }}
                  style={{
                    maxHeight: '100%',
                    width: '20px',
                    marginLeft: '5px',
                  }}
                />

                <Flex bgColor="blue.50" alignItems="center" px={2} py={1}>
                  <Text
                    fontSize="x-small"
                    textTransform="uppercase"
                    fontWeight="bold"
                    color="indigo.600"
                    cursor="default"
                  >
                    Beta
                  </Text>
                </Flex>
              </HStack>
            </Link>
            <Heading
              as="h1"
              size="md"
              whiteSpace="nowrap"
              fontWeight="light"
              color="fg.400"
            >
              /
            </Heading>
            <Box>
              <Link
                href="/"
                _hover={{
                  textDecor: 'none',
                }}
              >
                <Heading
                  as="h1"
                  size="md"
                  overflow="auto"
                  whiteSpace="nowrap"
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="semibold"
                  color="fg.800"
                >
                  {name || slug}
                </Heading>
              </Link>
              {isMobileView && <Text fontSize="sm">{entryPoint.filename}</Text>}
            </Box>
            {!isMobileView && (
              <>
                <Heading
                  as="h1"
                  size="md"
                  whiteSpace="nowrap"
                  fontWeight="light"
                  color="fg.400"
                >
                  /
                </Heading>
                <AppletPaths />
              </>
            )}
          </HStack>

          <HStack gap={2}>
            {!isMobileView && <AppletActions />}
            {user?.email ? (
              <Menu>
                {() => (
                  <>
                    <MenuButton>
                      <Image
                        src={user.image as string}
                        alt={user.username as string}
                        height={32}
                        width={32}
                        style={{ borderRadius: '100%' }}
                      />
                    </MenuButton>
                    <MenuList>
                      <MenuItem>
                        <Button
                          variant="link"
                          color="inherit"
                          fontWeight="normal"
                          leftIcon={<PiSignOutDuotone />}
                        >
                          <Link href="/logout">Sign out</Link>
                        </Button>
                      </MenuItem>
                    </MenuList>
                  </>
                )}
              </Menu>
            ) : (
              <Button variant="outline" size="sm" leftIcon={<MdLogin />}>
                <Link href={`${getZipperDotDevUrl().origin}/auth/from/${slug}`}>
                  Sign In
                </Link>
              </Button>
            )}
          </HStack>
        </HStack>
        {isMobileView && (
          <HStack
            py={5}
            justify="space-between"
            spacing={3}
            alignItems="center"
            flex={1}
            minW={0}
          >
            <AppletPaths />
            <AppletActions />
          </HStack>
        )}
      </Container>
    </>
  );
};

export default Header;
