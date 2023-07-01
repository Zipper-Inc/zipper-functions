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
import { SiNotion } from 'react-icons/si';

import { ConnectorInputProps } from './types';

export const NotionUserConnectorInput: React.FC<ConnectorInputProps> = ({
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
                Notion
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
                  <Badge variant="subtle" color="gray.400" fontSize=".6rem">
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
                bgColor="white"
                colorScheme="purple"
                borderColor="gray.300"
                fontSize="sm"
                minW="3xs"
              >
                <HStack>
                  <SiNotion />
                  <Text>Authorize Notion</Text>
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
        <Text>{`Authed to Slack as `}</Text>
        <Text fontWeight={'medium'}>
          {c.appConnectorUserAuths[0].metadata.user ||
            c.appConnectorUserAuths[0].metadata.id}
        </Text>
      </HStack>
      <Button variant={'link'} onClick={onDelete}>
        Remove
      </Button>
    </HStack>
  );
};
