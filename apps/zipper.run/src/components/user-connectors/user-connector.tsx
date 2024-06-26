import { Button, VStack, Text, HStack } from '@chakra-ui/react';
import {
  ConnectorActionProps,
  UserAuthConnector,
  UserAuthConnectorType,
} from '@zipper/types';
import { FiGithub } from 'react-icons/fi';
import { BsSlack } from 'react-icons/bs';
import { IconBaseProps, IconType } from 'react-icons';
import { AuthedConnectorType, authedUserGetters } from '@zipper/utils';

const connectors: Record<
  UserAuthConnectorType,
  { icon: IconType; name: string }
> = {
  github: {
    name: 'GitHub',
    icon: FiGithub,
  },
  slack: {
    name: 'Slack',
    icon: BsSlack,
  },
};

export type UserConnectorProps = ConnectorActionProps & {
  connector: UserAuthConnector;
  optional: boolean;
};

const getAuthedUser = ({
  metadata,
  type,
}: {
  metadata: any;
  type: AuthedConnectorType;
}) => {
  return authedUserGetters[type](metadata);
};

const iconStyles: IconBaseProps = {
  size: 20,
};

const UserConnector: React.FC<UserConnectorProps> = ({
  connector,
  authUrl,
  onDelete,
  optional,
}) => {
  const type = connector.type as AuthedConnectorType;
  const connectorName = connectors[type].name;
  const Icon = connectors[type].icon;

  if (!connector.appConnectorUserAuths[0]) {
    return (
      <VStack spacing={3} align="start">
        <Button
          colorScheme="purple"
          variant={optional ? 'outline' : 'solid'}
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
      <HStack fontSize="sm" fontWeight="normal" color="fg.900">
        <Icon {...iconStyles} />
        <Text color="fg.700">
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
