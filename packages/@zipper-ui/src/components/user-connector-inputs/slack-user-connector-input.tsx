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
import { FiSlack } from 'react-icons/fi';
import { ConnectorInputProps } from './types';

export const SlackUserConnectorInput: React.FC<ConnectorInputProps> = ({
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
                Slack
              </Heading>
              <Box mt={1}>
                <Badge
                  variant="subtle"
                  colorScheme="purple"
                  fontSize="xs"
                  fontWeight="medium"
                  py="0.5"
                  px={2}
                >
                  Connector
                </Badge>
              </Box>
              {!c.isUserAuthRequired && (
                <Box mt={1}>
                  <Badge variant="subtle" color="fg.400" fontSize=".6rem">
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
                borderColor="fg.300"
                fontSize="sm"
                minW="3xs"
              >
                <HStack>
                  <FiSlack />
                  <Text>Authorize Slack</Text>
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
        <Text>{'Authed to Slack as '}</Text>
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
