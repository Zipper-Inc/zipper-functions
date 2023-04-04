import { createContext, useContext, useEffect, useState } from 'react';
import noop from '~/utils/noop';
import {
  AppInfo,
  ConnectorType,
  InputParam,
  InputType,
  JSONEditorInputTypes,
} from '@zipper/types';
import { safeJSONParse } from '@zipper/utils';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppQueryOutput, AppEventUseQueryResult } from '~/types/trpc';
import useInterval from '~/hooks/use-interval';
import getRunUrl from '~/utils/get-run-url';
import { AppConnectorUserAuth } from '@prisma/client';
import { parseInputForTypes } from '~/utils/parse-input-for-types';
import { getAppHash, getAppVersionFromHash } from '~/utils/hashing';
import { useUser } from '@clerk/nextjs';

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
  inputError?: string;
  setResults: (results: Record<string, string>) => void;
  run: (isCurrentFileAsEntryPoint?: boolean) => void;
};

export const RunAppContext = createContext<FunctionCallContextType>({
  appInfo: {} as AppInfo,
  formMethods: {},
  inputParams: undefined,
  isRunning: false,
  lastRunVersion: '',
  results: {},
  appEventsQuery: undefined,
  inputError: undefined,
  userAuthConnectors: [],
  setResults: noop,
  run: noop,
});

type RunState = 'idle' | 'prerun' | 'running' | 'ended';

export function RunAppProvider({
  app,
  children,
  inputParams,
  inputError,
  filename,
  onBeforeRun,
  onAfterRun,
}: {
  app: AppQueryOutput;
  children: any;
  inputParams?: InputParam[];
  inputError?: string;
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
  const [runState, setRunState] = useState<RunState>('idle');
  const [isCurrentFileTheEntryPoint, setIsCurrentFileTheEntryPoint] = useState<
    boolean | undefined
  >();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [lastRunVersion, setLastRunVersion] = useState(
    () => app.lastDeploymentVersion || getAppVersionFromHash(getAppHash(app)),
  );

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

  const run: Record<RunState, (isCurrentFileTheEntryPoint?: boolean) => void> =
    {
      idle: (isCurrentFileTheEntryPoint) => {
        setIsRunning(true);
        setRunState('prerun');
        setIsCurrentFileTheEntryPoint(isCurrentFileTheEntryPoint);
      },
      prerun: async () => {
        await onBeforeRun();
      },
      running: async () => {
        const formValues = formMethods.getValues();
        const inputs: Record<string, any> = {};
        let formKeys: string[] = [];

        // We need to filter the form values since `useForm` hook keeps these around
        if (isCurrentFileTheEntryPoint) {
          formKeys =
            inputParams?.map(({ key, type }) => `${key}:${type}`) || [];
        } else {
          const mainScript = app.scripts.find(
            (s) => s.id === app.scriptMain?.scriptId,
          );
          const mainInputParams = parseInputForTypes(mainScript?.code);
          if (!mainInputParams) {
            setIsRunning(false);
            return;
          }
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
        const version = app.lastDeploymentVersion || lastRunVersion;

        const result = await fetch(
          getRunUrl(
            slug,
            version,
            isCurrentFileTheEntryPoint ? filename : 'main.ts',
          ),
          {
            method: 'POST',
            body: JSON.stringify(inputs),
            credentials: 'include',
          },
        ).then((r) => r.text());

        setResults({ ...results, [filename || 'main.ts']: result });

        // refetch logs
        appEventsQuery.refetch();

        setRunState('ended');
      },
      ended: async () => {
        setIsRunning(false);
        await onAfterRun();
        setIsCurrentFileTheEntryPoint(undefined);
        setRunState('idle');
      },
    };

  useEffect(() => {
    if (runState !== 'idle') {
      run[runState]();
    }
  }, [runState]);

  useEffect(() => {
    if (
      app.lastDeploymentVersion &&
      app.lastDeploymentVersion !== lastRunVersion
    ) {
      setLastRunVersion(app.lastDeploymentVersion);
    }
  }, [app.lastDeploymentVersion]);

  useEffect(() => {
    if (runState === 'prerun') {
      setRunState('running');
    }
  }, [app.updatedAt]);

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
        inputError,
        lastRunVersion,
        results,
        appEventsQuery,
        userAuthConnectors: app.connectors.filter(
          (c) => c.userScopes.length > 0,
        ) as UserAuthConnector[],
        setResults,
        run: async (isCurrentFileTheEntryPoint?: boolean) => {
          if (!inputParams) return;
          run[runState](isCurrentFileTheEntryPoint);
        },
      }}
    >
      {children}
    </RunAppContext.Provider>
  );
}

export const useRunAppContext = () => useContext(RunAppContext);
