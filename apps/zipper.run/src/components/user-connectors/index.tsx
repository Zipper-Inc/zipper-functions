import { VStack } from '@chakra-ui/react';
import UserConnector, { UserConnectorProps } from './user-connector';
import {
  ConnectorActionProps,
  ConnectorType,
  UserAuthConnector,
} from '@zipper/types';

type AuthUserConnectorsProps = Pick<UserConnectorProps, 'appTitle'> & {
  userAuthConnectors: UserAuthConnector[];
  actions: Record<ConnectorType, ConnectorActionProps>;
};

const AuthUserConnectors: React.FC<AuthUserConnectorsProps> = ({
  actions,
  userAuthConnectors,
  appTitle,
}) => {
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
      {userAuthConnectors.map((uac) => (
        <li key={uac.type}>
          <UserConnector
            connector={uac}
            {...actions[uac.type]}
            appTitle={appTitle}
          />
        </li>
      ))}
    </VStack>
  );
};

export default AuthUserConnectors;
