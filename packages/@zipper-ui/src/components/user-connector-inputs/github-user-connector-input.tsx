import {
  Box,
  FormLabel,
  VStack,
  HStack,
  Heading,
  Badge,
  Flex,
  Link,
  Button,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { GitHubCheckTokenResponse } from '@zipper/types';
import { VscAdd } from 'react-icons/vsc';
import { ConnectorInputProps } from './types';

export const GitHubUserConnectorInput: React.FC<ConnectorInputProps> = ({
  connector: c,
  onDelete,
  authUrl,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen: c.isUserAuthRequired,
  });

  if (!c.appConnectorUserAuths[0]) {
    return (
      <Box width="100%" position="relative">
        <FormLabel my="2" mx={0}>
          <VStack justify="start" align="start" spacing={1.5}>
            <HStack spacing={2} align="center" width="full" paddingRight={8}>
              <Heading
                size="sm"
                fontWeight="medium"
                ml={0.5}
                mr={2}
                alignSelf="center"
                opacity={!isOpen ? '50%' : '100%'}
              >
                GitHub
              </Heading>
              <Box mt={1} opacity={!isOpen ? '50%' : '100%'}>
                <Badge
                  variant="subtle"
                  colorScheme="purple"
                  fontSize="xs"
                  fontWeight="medium"
                  rounded="full"
                  py="0.5"
                  px={2}
                >
                  Connector
                </Badge>
              </Box>
              {!c.isUserAuthRequired && (
                <Box mt={1}>
                  <Badge variant="subtle" color="gray.400" fontSize=".6rem">
                    {!isOpen ? 'Optional' : 'Included'}
                  </Badge>
                </Box>
              )}
            </HStack>
            {isOpen && (
              <Flex width="100%">
                <Link href={authUrl}>Add to GitHub</Link>
              </Flex>
            )}
          </VStack>
        </FormLabel>
        {!c.isUserAuthRequired && (
          <Flex
            position="absolute"
            right={0}
            left={!isOpen ? 0 : undefined}
            top={0}
            height={10}
            alignItems="center"
            justifyContent="end"
          >
            <Button
              display="flex"
              alignItems="center"
              justifyContent="end"
              name={!isOpen ? 'Add input' : 'Remove input'}
              variant="unstyled"
              _hover={{
                color: 'purple.500',
              }}
              size="xs"
              mt="2px"
              p={1}
              height={6}
              width={!isOpen ? 'full' : 6}
              onClick={!isOpen ? onOpen : onClose}
            >
              <Box
                transition="all 100ms ease-in-out"
                transform={!isOpen ? 'rotate(0deg)' : 'rotate(45deg)'}
              >
                <VscAdd />
              </Box>
            </Button>
          </Flex>
        )}
      </Box>
    );
  }

  return (
    <HStack>
      <HStack flexGrow={1}>
        <Text>{`Authed to GitHub as `}</Text>
        <Text fontWeight={'medium'}>
          {(
            c.appConnectorUserAuths[0]
              .metadata as GitHubCheckTokenResponse['user']
          ).login ||
            (
              c.appConnectorUserAuths[0]
                .metadata as GitHubCheckTokenResponse['user']
            ).id}
        </Text>
      </HStack>
      <Button variant="link" onClick={onDelete}>
        Remove
      </Button>
    </HStack>
  );
};
