import { useToast } from '@chakra-ui/react';
import { FunctionUserConnectors } from '@zipper/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';
import { useRunAppContext } from '../context/run-app-context';

export const AppEditSidebarAppletConnectors = () => {
  const toast = useToast();
  const router = useRouter();
  const context = trpc.useContext();
  // toast duration
  const duration = 1500;

  const { userAuthConnectors, appInfo } = useRunAppContext();

  const appId = appInfo.id;

  // state to hold whether user needs to authenticate with slack
  const [slackAuthRequired, setSlackAuthRequired] = useState(false);
  // state to hold whether user needs to authenticate with github
  const [githubAuthRequired, setGitHubAuthRequired] = useState(false);
  // state to hold whether user needs to authenticate with github

  // get the existing Slack connector data from the database
  const slackConnector = trpc.slackConnector.get.useQuery(
    { appId: appInfo.id },
    {
      enabled: slackAuthRequired,
    },
  );
  // get the existing GitHub connector data from the database
  const githubConnector = trpc.githubConnector.get.useQuery(
    { appId: appInfo.id },
    {
      enabled: githubAuthRequired,
    },
  );

  const deleteConnectorUserAuth =
    trpc.slackConnector.deleteUserAuth.useMutation({
      onSuccess: () => {
        context.app.byResourceOwnerAndAppSlugs.invalidate({
          appSlug: router.query['app-slug'] as string,
          resourceOwnerSlug: router.query['resource-owner'] as string,
        });

        toast({
          title: 'Slack user auth revoked.',
          status: 'success',
          duration,
          isClosable: true,
        });
      },
    });
  const deleteGithubConnectorUserAuth =
    trpc.githubConnector.deleteUserAuth.useMutation({
      onSuccess: () => {
        context.app.byResourceOwnerAndAppSlugs.invalidate({
          appSlug: router.query['app-slug'] as string,
          resourceOwnerSlug: router.query['resource-owner'] as string,
        });
        toast({
          title: 'GitHub user auth revoked.',
          status: 'success',
          duration,
          isClosable: true,
        });
      },
    });

  const deleteOpenAISecret = trpc.secret.delete.useMutation({
    onSuccess: () => {
      context.app.byResourceOwnerAndAppSlugs.invalidate({
        appSlug: router.query['app-slug'] as string,
        resourceOwnerSlug: router.query['resource-owner'] as string,
      });
      toast({
        title: 'OpenAI user auth revoked.',
        status: 'success',
        duration,
        isClosable: true,
      });
    },
  });

  // get the Slack auth URL -- if required --from the backend
  // (it includes an encrypted state value that links the auth request to the app)
  // TODO: get from slack-get-install-link applet?
  const slackAuthURL = trpc.slackConnector.getAuthUrl.useQuery(
    {
      appId,
      scopes: {
        bot: slackConnector.data?.botScopes || [],
        user: slackConnector.data?.userScopes || [],
      },
      postInstallationRedirect: window.location.href,
    },
    {
      enabled: slackConnector.isFetched,
    },
  );

  // get the Github auth URL -- if required --from the backend
  // (it includes an encrypted state value that links the auth request to the app)
  const githubAuthURL = trpc.githubConnector.getAuthUrl.useQuery(
    {
      appId,
      scopes: githubConnector.data?.userScopes || [],
      postInstallationRedirect: window.location.href,
    },
    {
      enabled: githubConnector.isFetched,
    },
  );

  useEffect(() => {
    if (userAuthConnectors.find((c) => c.type === 'slack')) {
      setSlackAuthRequired(true);
    }
    if (userAuthConnectors.find((c) => c.type === 'github')) {
      setGitHubAuthRequired(true);
    }
  }, []);

  return (
    <FunctionUserConnectors
      userAuthConnectors={userAuthConnectors}
      actions={{
        github: {
          authUrl: githubAuthURL.data?.url || '#',
          onDelete: () => {
            deleteGithubConnectorUserAuth.mutateAsync({
              appId,
            });
          },
        },
        slack: {
          authUrl: slackAuthURL.data?.url || '#',
          onDelete: () => {
            deleteConnectorUserAuth.mutateAsync({
              appId,
            });
          },
        },
      }}
    />
  );
};
