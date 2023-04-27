import { createContext, useContext, useEffect, useState } from 'react';
import noop from '~/utils/noop';
import { AppInfo, ConnectorType, InputParam } from '@zipper/types';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppQueryOutput, AppEventUseQueryResult } from '~/types/trpc';
import useInterval from '~/hooks/use-interval';
import { AppConnectorUserAuth } from '@prisma/client';
import { getAppHash, getAppVersionFromHash } from '~/utils/hashing';
import { useUser } from '@clerk/nextjs';
import { useEditorContext } from './editor-context';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';

type UserAuthConnector = {
  type: ConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: AppConnectorUserAuth[];
};

export type FunctionCallContextType = {
  appInfo: AppInfo;
  formMethods: any;
  inputParams?: InputParam[];
  isRunning: boolean;
  lastRunVersion: string;
  results: Record<string, string>;
  userAuthConnectors: UserAuthConnector[];
  appEventsQuery?: AppEventUseQueryResult;
  setResults: (results: Record<string, string>) => void;
  run: (isCurrentFileAsEntryPoint?: boolean) => void;
  boot: () => void;
};

export const RunAppContext = createContext<FunctionCallContextType>({
  appInfo: {} as AppInfo,
  formMethods: {},
  inputParams: undefined,
  isRunning: false,
  lastRunVersion: '',
  results: {},
  appEventsQuery: undefined,
  userAuthConnectors: [],
  setResults: noop,
  run: noop,
  boot: noop,
});

export function RunAppProvider({
  app,
  children,
  onBeforeRun,
  onAfterRun,
}: {
  app: AppQueryOutput;
  children: any;
  onBeforeRun: () => Promise<void>;
  onAfterRun: () => Promise<void>;
}) {
  const {
    id,
    name,
    description,
    slug,
    updatedAt,
    lastDeploymentVersion,
    canUserEdit,
  } = app;
  const formMethods = useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [lastRunVersion, setLastRunVersion] = useState(
    () => app.lastDeploymentVersion || getAppVersionFromHash(getAppHash(app)),
  );
  const utils = trpc.useContext();

  const runAppMutation = trpc.useMutation('app.run', {
    async onSuccess() {
      await utils.invalidateQueries([
        'app.byResourceOwnerAndAppSlugs',
        { resourceOwnerSlug: app.resourceOwner.slug, appSlug: slug },
      ]);
    },
  });

  const bootAppMutation = trpc.useMutation('app.boot', {
    async onSuccess() {
      await utils.invalidateQueries([
        'app.byResourceOwnerAndAppSlugs',
        { resourceOwnerSlug: app.resourceOwner.slug, appSlug: slug },
      ]);
    },
  });

  const { user } = useUser();
  const appEventsQuery = trpc.useQuery(
    ['appEvent.all', { deploymentId: `${id}@${lastRunVersion}` }],
    { enabled: !!user },
  );

  useInterval(async () => {
    if (lastRunVersion) {
      appEventsQuery.refetch();
    }
  }, 10000);

  const { currentScript, inputParams } = useEditorContext();

  const boot = async () => {
    await bootAppMutation.mutateAsync({
      appId: id,
    });

    // refetch logs
    appEventsQuery.refetch();
  };

  const run = async (isCurrentFileTheEntryPoint?: boolean) => {
    if (!inputParams) return;
    setIsRunning(true);
    await onBeforeRun();
    const formValues = formMethods.getValues();

    const result = await runAppMutation.mutateAsync({
      formData: formValues,
      appId: id,
      scriptId: isCurrentFileTheEntryPoint ? currentScript?.id : undefined,
    });

    if (result.ok && result.filename) {
      setResults({ ...results, [result.filename]: result.result });
    }

    // refetch logs
    appEventsQuery.refetch();

    setIsRunning(false);
    await onAfterRun();
  };

  useEffect(() => {
    if (
      app.lastDeploymentVersion &&
      app.lastDeploymentVersion !== lastRunVersion
    ) {
      setLastRunVersion(app.lastDeploymentVersion);
    }
  }, [app.lastDeploymentVersion]);

  return (
    <RunAppContext.Provider
      value={{
        appInfo: {
          id,
          name,
          description,
          slug,
          updatedAt,
          lastDeploymentVersion,
          canUserEdit,
        },
        formMethods,
        isRunning,
        lastRunVersion,
        results,
        appEventsQuery,
        userAuthConnectors: app.connectors.filter(
          requiredUserAuthConnectorFilter,
        ) as UserAuthConnector[],
        setResults,
        run,
        boot,
      }}
    >
      {children}
    </RunAppContext.Provider>
  );
}

export const useRunAppContext = () => useContext(RunAppContext);
