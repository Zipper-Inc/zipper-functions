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
      {userAuthConnectors.map((c) => {
        const ConnectorInput = userConnectorInputs[c.type];
        return (
          <ConnectorInput
            key={`${c.appId}+${c.type}`}
            connector={c}
            {...actions[c.type]}
          />
        );
      })}
    </>
  );
};
