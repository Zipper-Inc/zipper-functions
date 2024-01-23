import {
  Box,
  Divider,
  Flex,
  Heading,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import { EntryPointInfo } from '@zipper/types';
import { removeExtension } from '@zipper/utils';
import router from 'next/router';
import { useMemo } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import NextLink from 'next/link';

export default function Footer({
  entryPoint,
  runnableScripts,
  setLoading,
}: {
  entryPoint?: EntryPointInfo;
  runnableScripts: string[];
  setLoading: (value: boolean) => void;
}) {
  if (!entryPoint) {
    return <></>;
  }

  const entryPointName = useMemo(
    () => removeExtension(entryPoint.filename),
    [entryPoint],
  );

  return (
    <Flex as="footer" position="fixed" w="full" bottom={0}>
      <Box w="full">
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
                      {entryPointName}
                    </Text>
                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </HStack>
                </MenuButton>
                <MenuList pb={0}>
                  <Box pb="4" pt="2" px={4}>
                    <Link
                      as={NextLink}
                      fontSize="sm"
                      fontWeight="medium"
                      href={`/${entryPoint.filename}`}
                      onClick={() => {
                        onClose();
                        setLoading(true);
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
    </Flex>
  );
}
