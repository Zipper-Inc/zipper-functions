import { createContext, useContext, useState } from 'react';
import noop from '~/utils/noop';
import { AppInfo, ConnectorType, InputParam } from '@zipper/types';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppQueryOutput } from '~/types/trpc';
import { AppConnectorUserAuth } from '@prisma/client';
import { getAppVersionFromHash } from '~/utils/hashing';
import { useEditorContext } from './editor-context';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { getInputsFromFormData, safeJSONParse, uuid } from '@zipper/utils';
import { getLogger } from '~/utils/app-console';
import { prettyLog, PRETTY_LOG_TOKENS } from '~/utils/pretty-log';

type UserAuthConnector = {
  type: ConnectorType;
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

  const { currentScript, inputParams } = useEditorContext();

  const boot = async () => {
    try {
      const hash = await saveAppBeforeRun();
      const version = getAppVersionFromHash(hash);
      if (!version) throw new Error('No version found');

      const logger = getLogger({ appId: app.id, version });

      const logsToIgnore = await logger.fetch();

      const updateLogs = async () => {
        const logs = await logger.fetch();
        if (!logs.length) return;
        if (logsToIgnore.length) logs.splice(0, logsToIgnore.length);

        setLogStore((prev) => {
          const prevLogs = prev[logger.url] || [];
          const newLogs = prevLogs.length > logs.length ? prevLogs : logs;
          return { ...prev, [logger.url]: newLogs };
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

    const versionLogger = getLogger({ appId: app.id, version });
    const runLogger = getLogger({ appId: app.id, version, runId });

    // fetch deploy logs so we don't display them again
    const vLogsToIgnore = await versionLogger.fetch();

    // Start fetching logs
    const updateLogs = async () => {
      const [vLogs, rLogs] = await Promise.all([
        versionLogger.fetch(),
        runLogger.fetch(),
      ]);

      if (!vLogs?.length && !rLogs?.length) return;

      if (vLogsToIgnore.length) vLogs.splice(0, vLogsToIgnore.length);

      // We use a log store because the log fetcher grabs all the logs for a given object
      // This way, we always update the store with the freshest logs without duplicating
      setLogStore((prev) => {
        const prevVLogs = prev[versionLogger.url] || [];
        const prevRLogs = prev[runLogger.url] || [];

        const newVLogs = prevVLogs.length > vLogs.length ? prevVLogs : vLogs;
        const newRLogs = prevRLogs.length > rLogs.length ? prevRLogs : rLogs;
        return {
          ...prev,
          [versionLogger.url]: newVLogs,
          [runLogger.url]: newRLogs,
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
