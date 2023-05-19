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
} from '@chakra-ui/react';
import { getAppLink } from '@zipper/utils';
import { ZipperSymbol } from '@zipper/ui';
import { HiOutlineUpload, HiOutlinePencilAlt } from 'react-icons/hi';
import { AppInfo, EntryPointInfo } from '@zipper/types';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const duration = 1500;

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const zipperWorksUrl = `${protocol}://${process.env.NEXT_PUBLIC_ZIPPER_HOST}`;

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

  return (
    <>
      <Flex as="header" pt="20px" maxW="full" minW="md" paddingX={10}>
        <HStack spacing={3} alignItems="center" flex={1} minW={0}>
          <Link height={4} href={zipperWorksUrl}>
            <ZipperSymbol style={{ maxHeight: '100%' }} />
          </Link>

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
                color="gray.800"
              >
                {name}
              </Heading>
            </Link>
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
                          color="gray.800"
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
                        backgroundColor={'gray.50'}
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
                              backgroundColor="gray.50"
                              px="4"
                              pt="2"
                              fontWeight="medium"
                              fontSize="sm"
                              _last={{
                                pb: 4,
                                borderEndRadius: 8,
                                borderBottomLeftRadius: 8,
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
                color="gray.800"
              >
                {entryPoint.filename.replace(/\.ts$/, '')}
              </Heading>
            )}
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
        </HStack>
      </Flex>
    </>
  );
};

export default Header;
