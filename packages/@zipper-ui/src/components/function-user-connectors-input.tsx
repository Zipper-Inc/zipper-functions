import { Button, Heading, HStack, Image, Link, Text } from '@chakra-ui/react';
import { UserAuthConnector } from '@zipper/types';

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
          if (!c.appConnectorUserAuths[0]) {
            return (
              <Link href={slack.authUrl}>
                <Image
                  alt="Add to Slack"
                  src="https://platform.slack-edge.com/img/add_to_slack.png"
                  srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                />
              </Link>
            );
          }

          return (
            <HStack>
              <HStack flexGrow={1}>
                <Text>{`Authed to Slack as `}</Text>
                <Text fontWeight={'medium'}>
                  {c.appConnectorUserAuths[0].metadata.user ||
                    c.appConnectorUserAuths[0].metadata.id}
                </Text>
              </HStack>
              <Button variant={'link'} onClick={slack.onDelete}>
                Remove
              </Button>
            </HStack>
          );
        }
      })}
    </>
  );
}
