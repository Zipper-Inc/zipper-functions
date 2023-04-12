import { VStack, Text } from '@chakra-ui/react';
import UserConnector from './user-connector';
import {
  ConnectorActionProps,
  ConnectorType,
  UserAuthConnector,
} from '@zipper/types';

type AuthUserConnectorsProps = {
  userAuthConnectors: UserAuthConnector[];
  actions: Record<ConnectorType, ConnectorActionProps>;
  appTitle: string;
};

const AuthUserConnectors: React.FC<AuthUserConnectorsProps> = ({
  actions,
  userAuthConnectors,
  appTitle,
}) => {
  const unauthorizedConnectors = userAuthConnectors.filter(
    (uac) => !uac.appConnectorUserAuths[0],
  );
  const authorizedConnectors = userAuthConnectors.filter((uac) =>
    Boolean(uac.appConnectorUserAuths[0]),
  );

  return (
    <VStack
      as="ul"
      alignItems="stretch"
      bgColor="gray.50"
      p={6}
      rounded="2xl"
      spacing="2.5"
      listStyleType="none"
    >
      {unauthorizedConnectors.length > 0 && (
        <li>
          <Text color="gray.700" fontWeight="semibold" fontSize="lg">
            Sign in to use {appTitle}
          </Text>
        </li>
      )}
      {unauthorizedConnectors.concat(authorizedConnectors).map((uac) => (
        <li key={uac.type}>
          <UserConnector connector={uac} {...actions[uac.type]} />
        </li>
      ))}
    </VStack>
  );
};

export default AuthUserConnectors;
