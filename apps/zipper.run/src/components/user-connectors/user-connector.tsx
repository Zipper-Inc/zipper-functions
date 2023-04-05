import { Button, VStack, Text, HStack } from '@chakra-ui/react';
import {
  ConnectorActionProps,
  ConnectorType,
  UserAuthConnector,
} from '@zipper/types';
import { FiGithub } from 'react-icons/fi';
import { BsSlack } from 'react-icons/bs';
import { IconBaseProps, IconType } from 'react-icons';
import { authedUserGetters } from '@zipper/utils';

const connectors: Record<ConnectorType, { icon: IconType; name: string }> = {
  github: {
    name: 'Github',
    icon: FiGithub,
  },
  slack: {
    name: 'Slack',
    icon: BsSlack,
  },
};

type ConnectorButtonProps = ConnectorActionProps & {
  connector: UserAuthConnector;
};

const getAuthedUser = ({
  metadata,
  type,
}: {
  metadata: any;
  type: ConnectorType;
}) => {
  return authedUserGetters[type](metadata);
};

const iconStyles: IconBaseProps = {
  size: 20,
};

const UserConnector: React.FC<ConnectorButtonProps> = ({
  connector,
  authUrl,
  onDelete,
}) => {
  const type = connector.type;
  const connectorName = connectors[type].name;
  const Icon = connectors[type].icon;

  if (!connector.appConnectorUserAuths[0]) {
    return (
      <VStack spacing={3} align="start">
        <Text color="gray.700" fontWeight="semibold" fontSize="lg">
          Sign in to {connectorName} to use Team Dashboard
        </Text>
        <Button
          colorScheme="purple"
          w="full"
          gap={2}
          py="2.5"
          size="sm"
          fontWeight="medium"
          height="auto"
          onClick={() => {
            window.location.replace(authUrl);
          }}
        >
          <Icon {...iconStyles} />
          Sign in to {connectorName}
        </Button>
      </VStack>
    );
  }

  const authedUser = getAuthedUser({
    metadata: connector.appConnectorUserAuths[0].metadata,
    type,
  });

  return (
    <HStack justify="space-between">
      <HStack fontSize="sm" fontWeight="normal" color="gray.900">
        <Icon {...iconStyles} />
        <Text color="gray.700">
          <Text as="span" fontWeight="semibold">
            Signed in to {connectorName}
          </Text>{' '}
          as {authedUser.username || authedUser.userId}
        </Text>
      </HStack>
      <Button
        colorScheme="purple"
        variant="ghost"
        size="sm"
        fontWeight="normal"
        onClick={onDelete}
      >
        Sign out
      </Button>
    </HStack>
  );
};

export default UserConnector;
