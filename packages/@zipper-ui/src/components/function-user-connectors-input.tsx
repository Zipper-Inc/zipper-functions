import { Button, Heading, HStack, Image, Link, Text } from '@chakra-ui/react';

type UserAuthConnector = {
  type: string;
  appId: string;
  isUserAuthRequired: boolean;
  userScopes: string[];
  appConnectorUserAuths: any[];
};

export function FunctionUserConnectors({
  userAuthConnectors,
  slack,
}: {
  userAuthConnectors: UserAuthConnector[];
  slack: {
    authUrl: string;
    onDelete: () => void;
  };
}) {
  return (
    <>
      <Heading size="sm" mb="4">
        Connectors
      </Heading>
      {userAuthConnectors.map((c) => {
        const needsAuth = c.appConnectorUserAuths.length === 0;
        if (c.type === 'slack') {
          if (needsAuth) {
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
                  {c.appConnectorUserAuths[0].metadata.user}
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
