import { AppConnectorUserAuth } from '@prisma/client';
import { generateReactHelpers } from '@uploadthing/react/hooks';
import {
  AppInfo,
  BootPayload,
  InputParam,
  UserAuthConnectorType,
} from '@zipper/types';
import { getInputsFromFormData, safeJSONParse, uuid } from '@zipper/utils';
import {
  createContext,
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { OurFileRouter } from '~/pages/api/uploadthing';
import { AppQueryOutput } from '~/types/trpc';
import { getAppVersionFromHash } from '~/utils/hashing';
import noop from '~/utils/noop';
import { prettyLog, PRETTY_LOG_TOKENS } from '~/utils/pretty-log';
import { trpc } from '~/utils/trpc';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { useEditorContext } from './editor-context';

type UserAuthConnector = {
  type: UserAuthConnectorType;
  appId: string;
  isUserAuthRequired: boolean;
  userScopes: string[];
  workspaceScopes: string[];
  appConnectorUserAuths: AppConnectorUserAuth[];
};

type AppInfoWithHashes = AppInfo & {
  playgroundVersionHash: string | null;
  publishedVersionHash: string | null;
};

export type RunAppContextType = {
  appInfo: AppInfoWithHashes;
  canUserEdit?: boolean;
  formMethods: any;
  inputParams?: InputParam[];
  isRunning: boolean;
  results: Record<string, string>;
  userAuthConnectors: UserAuthConnector[];
  setResults: (results: Record<string, string>) => void;
  run: (params?: {
    shouldSave?: boolean;
    isCurrentScriptEntryPoint?: boolean;
  }) => Promise<string | undefined>;
  boot: (params?: { shouldSave?: boolean }) => Promise<BootPayload>;
  bootPromise: MutableRefObject<Promise<BootPayload>>;
  bootPayload?: BootPayload;
  configs: Zipper.BootPayload['configs'];
};

export const RunAppContext = createContext<RunAppContextType>({
  appInfo: {} as AppInfoWithHashes,
  canUserEdit: false,
  formMethods: {},
  inputParams: undefined,
  isRunning: false,
  results: {},
  userAuthConnectors: [],
  setResults: noop,
  bootPromise: { current: Promise.resolve({} as BootPayload) },
  run: () => Promise.resolve(''),
  boot: () => Promise.resolve({} as BootPayload),
  bootPayload: {} as BootPayload,
  configs: {},
});

const getLogTs = ({ timestamp }: Pick<Zipper.Log.Message, 'timestamp'>) =>
  new Date(timestamp).getTime();

const sortLogs: Parameters<Zipper.Log.Message[]['sort']>[0] = (a, b) =>
  getLogTs(a) - getLogTs(b);

const uniqueLogs = (logs: Zipper.Log.Message[]) =>
  Object.values(
    logs.reduce(
      (prev: Record<string, Zipper.Log.Message>, curr) => ({
        ...prev,
        [curr.id]: curr,
      }),
      {},
    ),
  ).sort(sortLogs);

export function RunAppProvider({
  app,
  children,
  saveAppBeforeRun,
  addLog,
  setLogStore,
  preserveLogs,
}: {
  app: AppQueryOutput;
  children: any;
  saveAppBeforeRun: () => Promise<string>;
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
    isDataSensitive,
    isPrivate,
    requiresAuthToRun,
    editors,
    createdById,
    organizationId,
    canUserEdit,
  } = app;
  const formMethods = useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [bootPayload, setBootPayload] = useState<BootPayload>();
  const utils = trpc.useContext();
  const { useUploadThing } = generateReactHelpers<OurFileRouter>();
  const { isUploading, startUpload } = useUploadThing('imageUploader');
  const logTimersToCleanUp = useRef<number[]>([]);
  const bootPromise = useRef<Promise<any>>(Promise.resolve());

  const configs = bootPayload?.configs || {};

  const cleanUpLogTimers = () => {
    logTimersToCleanUp.current.forEach((id) => window.clearTimeout(id));
  };

  // clean up when unmounting
  useEffect(() => cleanUpLogTimers, []);
  const runAppMutation = trpc.app.run.useMutation({
    async onSuccess() {
      await utils.app.byResourceOwnerAndAppSlugs.invalidate({
        resourceOwnerSlug: app.resourceOwner.slug,
        appSlug: slug,
      });
    },
  });

  const bootAppMutation = trpc.app.boot.useMutation({
    async onSuccess(data) {
      if (!data.ok) {
        console.error(data.error);
        return;
      }
      await utils.app.byResourceOwnerAndAppSlugs.invalidate({
        resourceOwnerSlug: app.resourceOwner.slug,
        appSlug: slug,
      });
    },
    onError(error) {
      console.error(error);
    },
  });

  const logMutation = trpc.appLog.get.useMutation();

  const { currentScript, inputParams } = useEditorContext();

  const updateLogs = async ({
    version = app.playgroundVersionHash || '',
    oneSecondAgo = Date.now() - 1 * 1000,
    fromTimestamp = oneSecondAgo,
    runId,
  }: {
    version?: string;
    oneSecondAgo?: number;
    fromTimestamp?: number;
    runId?: string;
  } = {}) => {
    const [logs, runLogs] = await Promise.all([
      logMutation.mutateAsync({
        appId: app.id,
        version,
        fromTimestamp,
      }),

      runId
        ? await logMutation.mutateAsync({
            appId: app.id,
            version,
            runId,
            fromTimestamp,
          })
        : Promise.resolve([]),
    ]).catch(() => [[], []]);

    // wait a tick to prevent doing to much in a frame
    await Promise.resolve();

    setLogStore((prev) => {
      const logsKey = `${app.id}@${version}`;
      const prevLogs = prev[logsKey] || [];
      const newLogs = uniqueLogs([...prevLogs, ...logs]);

      const prevRunLogs = (runId && prev[runId]) || [];
      const newRunLogs = runId ? uniqueLogs([...prevRunLogs, ...runLogs]) : [];

      const logsHaveUpdate = newLogs.length !== prevLogs.length;
      const runLogsHaveUpdate = runId
        ? newRunLogs.length !== prevRunLogs.length
        : false;

      if (!logsHaveUpdate && !runLogsHaveUpdate) return prev;

      const store = { ...prev, [logsKey]: newLogs };

      if (runId) {
        store[runId] = newRunLogs;
      }

      // Only update the store if anything has changed
      // This is for performance reasons
      if (
        newLogs.length !== prevLogs.length ||
        (runId && newRunLogs.length !== prevRunLogs.length)
      ) {
        return store;
      }

      return prev;
    });
  };

  const startPollingUpdateLogs: typeof updateLogs = async ({
    runId,
    version,
    fromTimestamp,
  } = {}) => {
    await updateLogs({ runId });
    const id = window.setTimeout(
      () => updateLogs({ runId, version, fromTimestamp }),
      1000,
    );
    logTimersToCleanUp.current.push(id);
  };

  const boot = async ({ shouldSave = false } = {}) => {
    const promise = new Promise<BootPayload>(async (resolve, reject) => {
      try {
        const hash = shouldSave
          ? await saveAppBeforeRun()
          : app.playgroundVersionHash;

        const version = getAppVersionFromHash(hash);
        if (!version) throw new Error('No version found');

        const oneSecondAgo = Date.now() - 1 * 1000;
        startPollingUpdateLogs({ version, fromTimestamp: oneSecondAgo });

        const bootPayloadResponse = await bootAppMutation.mutateAsync({
          appId: id,
        });

        if (!bootPayloadResponse.ok) throw new Error('Boot failed');

        const bootPayload = bootPayloadResponse as BootPayload;
        setBootPayload(bootPayload);
        // stop any polling and do one last update
        cleanUpLogTimers();
        updateLogs({ version, fromTimestamp: oneSecondAgo });
        resolve(bootPayload);
      } catch (e) {
        reject(e);
      } finally {
        bootPromise.current = Promise.resolve();
      }
    });
    bootPromise.current = promise;
    return promise;
  };

  const run: RunAppContextType['run'] = async ({ shouldSave = false } = {}) => {
    if (!inputParams || !currentScript) return;
    if (!preserveLogs) setLogStore(() => ({}));

    setResults({ ...results, [currentScript.filename]: '' });
    setIsRunning(true);

    let version: string | undefined = undefined;

    try {
      const hash = shouldSave
        ? await saveAppBeforeRun()
        : app.playgroundVersionHash;
      version = getAppVersionFromHash(hash);

      if (!version) throw new Error('No version found');
    } catch (e: any) {
      console.log(e);
      setResults({
        ...results,
        [currentScript.filename]:
          'Something went wrong. Check the console for errors.',
      });
      setIsRunning(false);
      return;
    }

    const runId = uuid();
    const oneSecondAgo = Date.now() - 1 * 1000;

    startPollingUpdateLogs({ version, runId, fromTimestamp: oneSecondAgo });

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

    const uploadPromises = Object.entries(formValues).map(
      async ([key, value]) => {
        if (value instanceof FileList) {
          const file = value[0] as File;

          if (!isUploading) {
            const uploadedFile = await startUpload([file]);

            if (uploadedFile) {
              formValues[key] = uploadedFile[0]?.url;
            }
          }
        }
      },
    );

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    const result = await runAppMutation.mutateAsync({
      formData: formValues,
      appId: id,
      scriptId: currentScript.id,
      runId,
    });

    setIsRunning(false);

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

    cleanUpLogTimers();
    updateLogs({ version, runId, fromTimestamp: oneSecondAgo });

    return runId;
  };

  return (
    <RunAppContext.Provider
      value={{
        appInfo: {
          id,
          name,
          createdById,
          description,
          slug,
          updatedAt,
          playgroundVersionHash,
          publishedVersionHash,
          isDataSensitive,
          isPrivate,
          requiresAuthToRun,
          editors,
          organizationId,
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
        bootPromise,
        bootPayload,
        configs,
        canUserEdit,
      }}
    >
      {children}
    </RunAppContext.Provider>
  );
}

export const useRunAppContext = () => useContext(RunAppContext);
