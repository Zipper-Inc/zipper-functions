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
import router from 'next/router';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

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
}
