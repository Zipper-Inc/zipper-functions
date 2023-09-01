import { VStack, Text, HStack, Button, Spacer } from '@chakra-ui/react';
import UserConnector from './user-connector';
import {
  ConnectorActionProps,
  UserAuthConnector,
  UserAuthConnectorType,
} from '@zipper/types';

export type AuthUserConnectorsProps = {
  userAuthConnectors: UserAuthConnector[];
  actions: Record<UserAuthConnectorType, ConnectorActionProps>;
  appTitle: string;
  setSkipAuth: (b: boolean) => void;
  skipAuth: boolean;
};

const AuthUserConnectors: React.FC<AuthUserConnectorsProps> = ({
  actions,
  userAuthConnectors,
  appTitle,
  setSkipAuth,
  skipAuth,
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
      bgColor="fg.50"
      p={6}
      spacing="2.5"
      listStyleType="none"
    >
      {unauthorizedConnectors.length > 0 && (
        <HStack>
          <Text color="fg.700" fontWeight="semibold" fontSize="lg">
            Sign in to use {appTitle}
          </Text>
          <Spacer />
          <Button
            colorScheme="purple"
            variant="link"
            onClick={() => setSkipAuth(true)}
            visibility={skipAuth ? 'hidden' : 'visible'}
          >
            Skip
          </Button>
        </HStack>
      )}
      {unauthorizedConnectors.concat(authorizedConnectors).map((uac) => (
        <li key={uac.type}>
          <UserConnector
            connector={uac}
            {...actions[uac.type]}
            optional={skipAuth}
          />
        </li>
      ))}
    </VStack>
  );
};

export default AuthUserConnectors;
