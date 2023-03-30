import { Heading } from '@chakra-ui/react';
import { ConnectorType, UserAuthConnector } from '@zipper/types';
import { userConnectorInputs } from './user-connector-inputs';

type ConnectorActionProps = {
  onDelete: VoidFunction;
  authUrl: string;
};

type FunctionUserConnectorsProps = {
  userAuthConnectors: UserAuthConnector[];
  actions: Record<ConnectorType, ConnectorActionProps>;
};

export const FunctionUserConnectors: React.FC<FunctionUserConnectorsProps> = ({
  userAuthConnectors,
  actions,
}) => {
  return (
    <>
      <Heading size="sm" mb="4">
        Connectors
      </Heading>
      {userAuthConnectors.map((c) => {
        const ConnectorInput = userConnectorInputs[c.type];
        return (
          <ConnectorInput key={c.appId} connector={c} {...actions[c.type]} />
        );
      })}
    </>
  );
};
