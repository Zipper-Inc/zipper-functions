import { createContext, useContext, useState } from 'react';
import noop from '~/utils/noop';
import {
  AppInfo,
  InputParam,
  InputType,
  JSONEditorInputTypes,
} from '@zipper/types';
import { getLastRunVersion, safeJSONParse } from '@zipper/utils';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppQueryOutput, AppEventUseQueryResult } from '~/types/trpc';
import useInterval from '~/hooks/use-interval';
import getRunUrl from '~/utils/get-run-url';
import { AppConnectorUserAuth } from '@prisma/client';
import { parseInputForTypes } from '~/utils/parse-input-for-types';

export type FunctionCallContextType = {
  appInfo: AppInfo;
  formMethods: any;
  inputParams: InputParam[];
  isRunning: boolean;
  lastRunVersion: string;
  results: Record<string, string>;
  userAuthConnectors: {
    type: string;
    appId: string;
    isUserAuthRequired: boolean;
    userScopes: string[];
    workspaceScopes: string[];
    appConnectorUserAuths: AppConnectorUserAuth[];
  }[];
  appEventsQuery?: AppEventUseQueryResult;
  setResults: (results: Record<string, string>) => void;
  run: (isCurrentFileAsEntryPoint?: boolean) => void;
};

export const RunAppContext = createContext<FunctionCallContextType>({
  appInfo: {} as AppInfo,
  formMethods: {},
  inputParams: [],
  isRunning: false,
  lastRunVersion: '',
  results: {},
  appEventsQuery: undefined,
  userAuthConnectors: [],
  setResults: noop,
  run: noop,
});

export function RunAppProvider({
  app,
  children,
  inputParams,
  filename,
  onBeforeRun,
  onAfterRun,
}: {
  app: AppQueryOutput;
  children: any;
  inputParams: InputParam[];
  filename?: string;
  onBeforeRun: VoidFunction;
  onAfterRun: VoidFunction;
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
  const [lastRunVersion, setLastRunVersion] = useState(getLastRunVersion(app));
  const appEventsQuery = trpc.useQuery([
    'appEvent.all',
    { deploymentId: `${id}@${lastRunVersion}` },
  ]);

  const utils = trpc.useContext();
  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id }]);
    },
  });

  useInterval(async () => {
    if (lastRunVersion) {
      appEventsQuery.refetch();
    }
  }, 10000);

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
        inputParams,
        lastRunVersion,
        results,
        appEventsQuery,
        userAuthConnectors: app.connectors.filter(
          (c) => c.isUserAuthRequired && c.userScopes.length > 0,
        ),
        setResults,
        run: async (isCurrentFileAsEntryPoint?: boolean) => {
          setIsRunning(true);
          await onBeforeRun();

          const formValues = formMethods.getValues();
          const inputs: Record<string, any> = {};
          let formKeys: string[] = [];

          // We need to filter the form values since `useForm` hook keeps these around
          if (isCurrentFileAsEntryPoint) {
            formKeys = inputParams.map(({ key, type }) => `${key}:${type}`);
          } else {
            const mainScript = app.scripts.find(
              (s) => s.id === app.scriptMain?.scriptId,
            );
            const mainInputParams = parseInputForTypes(mainScript?.code);
            formKeys = mainInputParams.map(({ key, type }) => `${key}:${type}`);
          }

          Object.keys(formValues)
            .filter((k) => formKeys.includes(k))
            .forEach((k) => {
              const [inputKey, type] = k.split(':');

              const value = JSONEditorInputTypes.includes(type as InputType)
                ? safeJSONParse(
                    formValues[k],
                    undefined,
                    type === InputType.array ? [] : {},
                  )
                : formValues[k];
              inputs[inputKey as string] = value;
            });

          /**
           * @todo detect if code changes instead of always running a new version
           * either that, or make version name based on hash of files
           */
          const version = getLastRunVersion();

          const result = await fetch(
            getRunUrl(
              slug,
              version,
              isCurrentFileAsEntryPoint ? filename : 'main.ts',
            ),
            {
              method: 'POST',
              body: JSON.stringify(inputs),
              credentials: 'include',
            },
          ).then((r) => r.text());

          setResults({ ...results, [filename || 'main.ts']: result });

          setLastRunVersion(version);
          editAppMutation.mutateAsync({
            id,
            data: { lastDeploymentVersion: version },
          });

          // refetch logs
          appEventsQuery.refetch();

          setIsRunning(false);
          onAfterRun();
        },
      }}
    >
      {children}
    </RunAppContext.Provider>
  );
}

export const useRunAppContext = () => useContext(RunAppContext);
