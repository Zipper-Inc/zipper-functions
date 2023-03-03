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

export type FunctionCallContextType = {
  appInfo: AppInfo;
  formMethods: any;
  inputParams: InputParam[];
  isRunning: boolean;
  lastRunVersion: string;
  result: string;
  appEventsQuery?: AppEventUseQueryResult;
  run: () => void;
};

export const RunAppContext = createContext<FunctionCallContextType>({
  appInfo: {} as AppInfo,
  formMethods: {},
  inputParams: [],
  isRunning: false,
  lastRunVersion: '',
  result: '',
  appEventsQuery: undefined,
  run: noop,
});

export function RunAppProvider({
  app,
  children,
  inputParams,
  onBeforeRun,
  onAfterRun,
}: {
  app: AppQueryOutput;
  children: any;
  inputParams: InputParam[];
  onBeforeRun: VoidFunction;
  onAfterRun: VoidFunction;
}) {
  const { id, name, description, slug, updatedAt, lastDeploymentVersion } = app;
  const formMethods = useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState('');
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
        },
        formMethods,
        isRunning,
        inputParams,
        lastRunVersion,
        result,
        appEventsQuery,
        run: async () => {
          setIsRunning(true);
          await onBeforeRun();

          const formValues = formMethods.getValues();
          const inputs: Record<string, any> = {};

          // We need to filter the form values since `useForm` hook keeps these around
          const formKeys = inputParams.map(({ key, type }) => `${key}:${type}`);

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

          const result = await fetch(getRunUrl(slug, version), {
            method: 'POST',
            body: JSON.stringify(inputs),
            credentials: 'include',
          }).then((r) => r.text());

          setResult(result);

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
