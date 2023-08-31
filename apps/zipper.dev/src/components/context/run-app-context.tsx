import { createContext, useContext, useState } from 'react';
import noop from '~/utils/noop';
import { AppInfo, InputParam, UserAuthConnectorType } from '@zipper/types';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppQueryOutput } from '~/types/trpc';
import { AppConnectorUserAuth } from '@prisma/client';
import { getAppVersionFromHash } from '~/utils/hashing';
import { useEditorContext } from './editor-context';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { getInputsFromFormData, safeJSONParse, uuid } from '@zipper/utils';
import { prettyLog, PRETTY_LOG_TOKENS } from '~/utils/pretty-log';

type UserAuthConnector = {
  type: UserAuthConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: AppConnectorUserAuth[];
};

export type RunAppContextType = {
  appInfo: AppInfo;
  formMethods: any;
  inputParams?: InputParam[];
  isRunning: boolean;
  results: Record<string, string>;
  userAuthConnectors: UserAuthConnector[];
  setResults: (results: Record<string, string>) => void;
  run: (isCurrentFileAsEntryPoint?: boolean) => Promise<string | undefined>;
  boot: () => void;
  configs: Zipper.BootPayload['configs'];
};

export const RunAppContext = createContext<RunAppContextType>({
  appInfo: {} as AppInfo,
  formMethods: {},
  inputParams: undefined,
  isRunning: false,
  results: {},
  userAuthConnectors: [],
  setResults: noop,
  run: () => Promise.resolve(''),
  boot: noop,
  configs: {},
});

export function RunAppProvider({
  app,
  children,
  saveAppBeforeRun,
  onAfterRun,
  addLog,
  setLogStore,
  preserveLogs,
}: {
  app: AppQueryOutput;
  children: any;
  saveAppBeforeRun: () => Promise<string>;
  onAfterRun: () => Promise<void>;
  addLog: (method: Zipper.Log.Method, data: Zipper.Serializable[]) => void;
  setLogStore: (
    cb: (
      n: Record<string, Zipper.Log.Message[]>,
    ) => Record<string, Zipper.Log.Message[]>,
  ) => void;
  preserveLogs: boolean;
}) {
  const {
    id,
    name,
    description,
    slug,
    updatedAt,
    playgroundVersionHash,
    publishedVersionHash,
    canUserEdit,
    isDataSensitive,
  } = app;
  const formMethods = useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [configs, setConfigs] = useState<Zipper.BootPayload['configs']>({});
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

  const logMutation = trpc.useMutation('appLog.get');

  const { currentScript, inputParams } = useEditorContext();

  const boot = async () => {
    try {
      const hash = await saveAppBeforeRun();
      const version = getAppVersionFromHash(hash);
      if (!version) throw new Error('No version found');

      const logs = await logMutation.mutateAsync({ appId: app.id, version });

      const logsToIgnore = logs;

      const updateLogs = async () => {
        const logs = await logMutation.mutateAsync({ appId: app.id, version });
        if (!logs.length) return;
        if (logsToIgnore.length) logs.splice(0, logsToIgnore.length);

        setLogStore((prev) => {
          const prevLogs = prev[`${app.id}@${version}`] || [];
          const newLogs = prevLogs.length > logs.length ? prevLogs : logs;
          return { ...prev, [`${app.id}@${version}`]: newLogs };
        });
      };

      // Start polling for logs
      let currentPoll;
      const pollLogs = async () => {
        await updateLogs();
        currentPoll = setTimeout(() => pollLogs, 500);
      };
      pollLogs();

      const { configs } = await bootAppMutation.mutateAsync({
        appId: id,
      });

      if (configs) setConfigs(configs);

      // stop polling and do one last update
      // do it once more just time
      clearTimeout(currentPoll);
      updateLogs();
    } catch (e) {
      return;
    }
  };

  const run = async (isCurrentFileTheEntryPoint?: boolean) => {
    if (!inputParams) return;
    if (!preserveLogs) setLogStore(() => ({}));
    setIsRunning(true);

    let version: string | undefined = undefined;

    try {
      const hash = await saveAppBeforeRun();
      version = getAppVersionFromHash(hash);

      if (!version) throw new Error('No version found');
    } catch (e: any) {
      console.log(e);
      setResults({
        ...results,
        [isCurrentFileTheEntryPoint
          ? currentScript?.filename || 'main.ts'
          : 'main.ts']: 'Something went wrong. Check the console for errors.',
      });
      setIsRunning(false);
      return;
    }

    const runId = uuid();

    // fetch deploy logs so we don't display them again
    const vLogsToIgnore = await logMutation.mutateAsync({
      appId: app.id,
      version: version!,
    });

    // Start fetching logs
    const updateLogs = async () => {
      const vLogs = await logMutation.mutateAsync({
        appId: app.id,
        version: version!,
      });
      const rLogs = await logMutation.mutateAsync({
        appId: app.id,
        version: version!,
        runId: runId,
      });

      console.log({ rLogs });
      console.log({ vLogs });

      if (!vLogs?.length && !rLogs?.length) return;

      if (vLogsToIgnore.length) vLogs.splice(0, vLogsToIgnore.length);

      // We use a log store because the log fetcher grabs all the logs for a given object
      // This way, we always update the store with the freshest logs without duplicating
      setLogStore((prev) => {
        const prevVLogs = prev[`${app.id}@${version}`] || [];
        const prevRLogs = prev[runId] || [];

        const newVLogs = prevVLogs.length > vLogs.length ? prevVLogs : vLogs;
        const newRLogs = prevRLogs.length > rLogs.length ? prevRLogs : rLogs;
        return {
          ...prev,
          [`${app.id}@${version}`]: newVLogs,
          [runId]: newRLogs,
        };
      });
    };

    // Start polling for logs
    let currentPoll;
    const pollLogs = async () => {
      await updateLogs();
      currentPoll = setTimeout(pollLogs, 500);
    };
    pollLogs();

    const runStart = performance.now();
    const formValues = formMethods.getValues();

    // ReactHookForm doesn't parse destructured objects correctly i.e. { ...foo }: any
    // this is a hack but we should fix it upstream
    if (Object.keys(formValues).includes('{ ')) {
      const badlyParsedKey = Object.keys(formValues['{ '])[0];
      if (badlyParsedKey) {
        formValues[`{ ...${badlyParsedKey}`] = formValues['{ '][badlyParsedKey];
      }
    }
    const inputs = getInputsFromFormData(formValues, inputParams);
    const hasInputs = inputs && Object.values(inputs).length;

    addLog('info', [
      ...prettyLog(
        {
          badge: 'Run',
          topic: runId,
          subtopic: 'Pending',
          msg: hasInputs ? 'Running with inputs' : undefined,
        },
        { badgeStyle: { background: PRETTY_LOG_TOKENS['purple']! } },
      ),
      ...(hasInputs ? [inputs] : []),
    ]);

    const result = await runAppMutation.mutateAsync({
      formData: formValues,
      appId: id,
      scriptId: isCurrentFileTheEntryPoint ? currentScript?.id : undefined,
      runId,
    });

    if (result.ok && result.filename) {
      setResults({ ...results, [result.filename]: result.result });
    }

    const runElapsed = performance.now() - runStart;
    addLog('info', [
      ...prettyLog(
        {
          badge: 'Run',
          topic: runId,
          subtopic: 'Done',
          msg: `Got output in ${Math.round(runElapsed)}ms`,
        },
        { badgeStyle: { background: PRETTY_LOG_TOKENS['purple']! } },
      ),
      safeJSONParse(result.result, undefined, result.result) || undefined,
    ]);

    setIsRunning(false);

    // stop polling and do one last update
    // do it once more just time
    clearTimeout(currentPoll);
    updateLogs();

    await onAfterRun();

    return runId;
  };

  return (
    <RunAppContext.Provider
      value={{
        appInfo: {
          id,
          name,
          description,
          slug,
          updatedAt,
          playgroundVersionHash,
          publishedVersionHash,
          canUserEdit,
          isDataSensitive,
        },
        formMethods,
        isRunning,
        results,
        userAuthConnectors: app.connectors.filter(
          requiredUserAuthConnectorFilter,
        ) as UserAuthConnector[],
        setResults,
        run,
        boot,
        configs,
      }}
    >
      {children}
    </RunAppContext.Provider>
  );
}

export const useRunAppContext = () => useContext(RunAppContext);
