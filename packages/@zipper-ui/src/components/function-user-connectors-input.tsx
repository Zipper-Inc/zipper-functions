import {
  Badge,
  Box,
  Button,
  Flex,
  FormLabel,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { UserAuthConnector } from '@zipper/types';
import { VscAdd } from 'react-icons/vsc';
import SlackUserConnectorInput from './user-connector-inputs/slack-user-connector-input';

export function FunctionUserConnectors({
  userAuthConnectors,
  slack,
}: {
  userAuthConnectors: UserAuthConnector[];
  slack: {
    onDelete: () => void;
    authUrl: string;
  };
}) {
  return (
    <>
      <Heading size="sm" mb="4">
        Connectors
      </Heading>
      {userAuthConnectors.map((c) => {
        if (c.type === 'slack') {
          return (
            <SlackUserConnectorInput
              connector={c}
              onDelete={slack.onDelete}
              authUrl={slack.authUrl}
            />
          );
        }
      })}
    </>
  );
}
