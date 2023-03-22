import { Heading } from '@chakra-ui/react';
import { UserAuthConnector } from '@zipper/types';
import { SlackUserConnectorInput } from './user-connector-inputs/slack-user-connector-input';

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
