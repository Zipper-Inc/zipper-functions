import {
  Box,
  HStack,
  Flex,
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
} from '@chakra-ui/react';
import { getAppLink, getZipperDotDevUrl } from '@zipper/utils';
import { useEffectOnce, ZipperSymbol } from '@zipper/ui';
import { HiOutlineUpload, HiOutlinePencilAlt } from 'react-icons/hi';
import { AppInfo, EntryPointInfo } from '@zipper/types';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { readJWT } from '~/utils/get-zipper-auth';
import { deleteCookie } from 'cookies-next';
import Image from 'next/image';

const duration = 1500;

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

export type HeaderProps = AppInfo & {
  entryPoint?: EntryPointInfo;
  runnableScripts?: string[];
  runId?: string;
  setScreen: (screen: 'initial' | 'output') => void;
  setLoading: (value: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({
  canUserEdit,
  name,
  slug,
  entryPoint,
  runnableScripts = [],
  runId,
  setLoading,
}) => {
  const router = useRouter();
  const toast = useToast();
  const { onCopy, setValue } = useClipboard('');
  const [user, setUser] = useState<Record<string, string> | undefined>();

  useEffectOnce(() => {
    const token = document.cookie
      .split('; ')
      .find((c) => c.startsWith('__zipper_token'));

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

  /* -------------------------------------------- */
  /* Components                                   */
  /* -------------------------------------------- */

  const AppletRouter = () => {
    return (
      <Flex align="center" justify="space-between">
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
              fontWeight="semibold"
              color="fg.800"
            >
              {name || slug}
            </Heading>
          </Link>
        </Box>

        <Box>
          {runnableScripts.length > 1 ? (
            <Menu>
              {({ isOpen, onClose }) => (
                <>
                  <MenuButton>
                    <HStack>
                      <Text
                        fontFamily="heading"
                        fontSize="xl"
                        fontWeight="semibold"
                        color="fg.800"
                      >
                        {entryPoint.filename.slice(0, -3)}
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
                        {entryPoint.filename.slice(0, -3)}
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
                      .filter((s) => s !== entryPoint.filename)
                      .sort()
                      .map((s, i) => {
                        return (
                          <MenuItem
                            key={`${s}-${i}`}
                            onClick={() => {
                              onClose();
                              setLoading(true);
                              router.push(`/${s}`);
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
                            {s.slice(0, -3)}
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
      </Flex>
    );
  };

  return (
    <>
      <Container as="header" maxW="full">
        <HStack
          py={5}
          borderBottom="1px solid"
          borderColor="gray.100"
          justify="space-between"
          spacing={3}
          alignItems="center"
          flex={1}
          minW={0}
        >
          <HStack>
            <Link height={6} href={getZipperDotDevUrl().origin}>
              <ZipperSymbol style={{ maxHeight: '100%' }} />
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
                  fontSize="lg"
                  fontWeight="semibold"
                  color="fg.800"
                >
                  {name || slug}
                </Heading>
              </Link>
              <Text fontSize="sm">{entryPoint.filename}</Text>
            </Box>
          </HStack>

          {user?.email ? (
            <Image
              src={user.image as string}
              alt={user.username as string}
              height={40}
              width={40}
              style={{ borderRadius: '100%' }}
            />
          ) : (
            <Link href={`${getZipperDotDevUrl().origin}/auth/from/${slug}`}>
              Sign in
            </Link>
          )}
          {/* <Button
            variant="link"
            onClick={() => {
              deleteCookie('__zipper_token');
              deleteCookie('__zipper_refresh');
              window.location.reload();
            }}
          >
            Sign out
          </Button> */}
        </HStack>

        <HStack
          py={5}
          borderBottom="1px solid"
          borderColor="gray.100"
          justify="space-between"
          spacing={3}
          alignItems="center"
          flex={1}
          minW={0}
        >
          <Box>
            {runnableScripts.length > 1 ? (
              <Menu>
                {({ isOpen, onClose }) => (
                  <>
                    <MenuButton as={Button} variant="outline">
                      <HStack>
                        <Text
                          fontFamily="heading"
                          fontSize="md"
                          fontWeight="semibold"
                          color="fg.800"
                        >
                          {/* {entryPoint.filename.slice(0, -3)} */}
                          Files
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
                          {entryPoint.filename.slice(0, -3)}
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
                        .filter((s) => s !== entryPoint.filename)
                        .sort()
                        .map((s, i) => {
                          return (
                            <MenuItem
                              key={`${s}-${i}`}
                              onClick={() => {
                                onClose();
                                setLoading(true);
                                router.push(`/${s}`);
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
                              {s.slice(0, -3)}
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
        </HStack>

        {/* <Heading
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
                fontWeight="semibold"
                color="fg.800"
              >
                {name || slug}
              </Heading>
            </Link>
          </Box>
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
            {runnableScripts.length > 1 ? (
              <Menu>
                {({ isOpen, onClose }) => (
                  <>
                    <MenuButton>
                      <HStack>
                        <Text
                          fontFamily="heading"
                          fontSize="xl"
                          fontWeight="semibold"
                          color="fg.800"
                        >
                          {entryPoint.filename.slice(0, -3)}
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
                          {entryPoint.filename.slice(0, -3)}
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
                        .filter((s) => s !== entryPoint.filename)
                        .sort()
                        .map((s, i) => {
                          return (
                            <MenuItem
                              key={`${s}-${i}`}
                              onClick={() => {
                                onClose();
                                setLoading(true);
                                router.push(`/${s}`);
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
                              {s.slice(0, -3)}
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
          </Box> */}
        {/* </HStack> */}
        {/* <HStack>
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
          {canUserEdit && entryPoint.editUrl && (
            <Button
              colorScheme="purple"
              variant="ghost"
              display="flex"
              gap={2}
              fontWeight="medium"
              onClick={() => {
                window.location.href = entryPoint.editUrl;
              }}
            >
              <HiOutlinePencilAlt />
              <Text>Edit App</Text>
            </Button>
          )}
          {user ? (
            <Button
              variant="link"
              onClick={() => {
                deleteCookie('__zipper_token');
                deleteCookie('__zipper_refresh');
                window.location.reload();
              }}
            >
              Sign out
            </Button>
          ) : (
            <Link href={`${getZipperDotDevUrl().origin}/auth/from/${slug}`}>
              Sign in
            </Link>
          )}
        </HStack> */}
      </Container>
    </>
  );
};

export default Header;
