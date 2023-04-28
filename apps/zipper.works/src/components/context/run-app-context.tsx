import { createContext, useContext, useEffect, useState } from 'react';
import noop from '~/utils/noop';
import { AppInfo, ConnectorType, InputParam, LogMessage } from '@zipper/types';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppQueryOutput } from '~/types/trpc';
import { AppConnectorUserAuth } from '@prisma/client';
import { getAppVersionFromHash } from '~/utils/hashing';
import { useUser } from '@clerk/nextjs';
import { useEditorContext } from './editor-context';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { uuid } from '@zipper/utils';
import { getLogger } from '~/utils/app-console';
import { prettyLog } from '~/utils/pretty-log';

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
  lastRunId: string;
  results: Record<string, string>;
  userAuthConnectors: UserAuthConnector[];
  setResults: (results: Record<string, string>) => void;
  run: (isCurrentFileAsEntryPoint?: boolean) => void;
  boot: () => void;
  logs: LogMessage[];
  addLog: (method: Zipper.Log.Method, data: Zipper.Serializable[]) => void;
};

export const RunAppContext = createContext<RunAppContextType>({
  appInfo: {} as AppInfo,
  formMethods: {},
  inputParams: undefined,
  isRunning: false,
  lastRunId: '',
  results: {},
  userAuthConnectors: [],
  setResults: noop,
  run: noop,
  boot: noop,
  logs: [],
  addLog: noop,
});

export function RunAppProvider({
  app,
  children,
  saveAppBeforeRun,
  onAfterRun,
}: {
  app: AppQueryOutput;
  children: any;
  saveAppBeforeRun: () => Promise<string | null | void | undefined>;
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
    hash,
  } = app;
  const formMethods = useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [lastRunId, setLastRunId] = useState<string>('');
  const utils = trpc.useContext();
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [logStore, setLogStore] = useState<Record<string, LogMessage[]>>({});

  useEffect(() => {
    const newLogs: LogMessage[] = [];
    setLogs(
      newLogs
        .concat(...Object.values(logStore))
        .sort((a, b) => a.timestamp - b.timestamp),
    );
  }, [logStore]);

  const addLog = (method: Zipper.Log.Method, data: Zipper.Serializable[]) => {
    const newLog = {
      id: uuid(),
      method,
      data,
      timestamp: Date.now(),
    };

    setLogStore((prev) => {
      const local = prev.local || [];
      local.push(newLog);
      return { ...prev, local };
    });
  };

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
  const { currentScript, inputParams } = useEditorContext();

  const boot = async () => {
    await bootAppMutation.mutateAsync({
      appId: id,
    });
  };

  const run = async (isCurrentFileTheEntryPoint?: boolean) => {
    if (!inputParams) return;
    setIsRunning(true);

    addLog(
      'info',
      prettyLog({ topic: 'Save', subtopic: app.slug, badge: 'pending' }),
    );

    const hash = (await saveAppBeforeRun()) || (app.hash as string);
    const version = getAppVersionFromHash(hash);

    const runId = uuid();

    const versionLogger = getLogger({ appId: app.id, version });
    const runLogger = getLogger({ appId: app.id, version, runId });

    // Start fetching logs
    const updateLogs = async () => {
      const [vLogs, rLogs] = await Promise.all([
        versionLogger.fetch(),
        runLogger.fetch(),
      ]);

      if (!vLogs?.length && !rLogs?.length) return;

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
      currentPoll = setTimeout(() => pollLogs, 500);
    };
    pollLogs();

    const formValues = formMethods.getValues();
    const result = await runAppMutation.mutateAsync({
      formData: formValues,
      appId: id,
      scriptId: isCurrentFileTheEntryPoint ? currentScript?.id : undefined,
      runId,
    });

    if (result.ok && result.filename) {
      setResults({ ...results, [result.filename]: result.result });
    }

    setIsRunning(false);

    // stop polling and do one last update
    // do it once more just time
    clearTimeout(currentPoll);
    updateLogs();

    await onAfterRun();
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
          lastDeploymentVersion,
          canUserEdit,
          hash,
        },
        formMethods,
        isRunning,
        lastRunId,
        results,
        userAuthConnectors: app.connectors.filter(
          requiredUserAuthConnectorFilter,
        ) as UserAuthConnector[],
        setResults,
        run,
        boot,
        logs,
        addLog,
      }}
    >
      {children}
    </RunAppContext.Provider>
  );
}

export const useRunAppContext = () => useContext(RunAppContext);
