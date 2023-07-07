import {
  Box,
  FormLabel,
  VStack,
  HStack,
  Heading,
  Badge,
  Flex,
  Button,
  Text,
} from '@chakra-ui/react';
import { GithubConnectorAuthMetadata } from '@zipper/types';
import { VscGithub } from 'react-icons/vsc';
import { ConnectorInputProps } from './types';

export const GitHubUserConnectorInput: React.FC<ConnectorInputProps> = ({
  connector: c,
  onDelete,
  authUrl,
}) => {
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
              >
                GitHub
              </Heading>
              <Box mt={1}>
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
                  <Badge variant="subtle" color="fg400" fontSize=".6rem">
                    Optional
                  </Badge>
                </Box>
              )}
            </HStack>
            <Flex width="100%">
              <Button
                onClick={() => {
                  window.location.replace(authUrl);
                }}
                variant="outline"
                bgColor="bgColor"
                colorScheme="purple"
                borderColor="fg300"
                fontSize="sm"
                minW="3xs"
              >
                <HStack>
                  <VscGithub />
                  <Text>Authorize GitHub</Text>
                </HStack>
              </Button>
            </Flex>
          </VStack>
        </FormLabel>
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
              .metadata as GithubConnectorAuthMetadata['user']
          ).login ||
            (
              c.appConnectorUserAuths[0]
                .metadata as GithubConnectorAuthMetadata['user']
            ).id}
        </Text>
      </HStack>
      <Button variant="link" onClick={onDelete}>
        Remove
      </Button>
    </HStack>
  );
};
