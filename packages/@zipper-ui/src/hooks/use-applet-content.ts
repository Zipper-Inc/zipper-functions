/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AppletContentReturnType,
  AppletContentPanel,
  InputParams,
} from '@zipper/types';
import { useCallback, useState } from 'react';

export const useAppletContent = (): AppletContentReturnType => {
  const [previousPanels, setPreviousPanels] = useState<AppletContentPanel[]>(
    [],
  );
  const [inputs, setInputs] = useState<InputParams>();
  const [output, setOutput] = useState<string | undefined>();
  const [expandedInputs, setExpandedInputs] = useState<InputParams>();
  const [expandedOutput, setExpandedOutput] = useState<string | undefined>();
  const [expandedPath, setExpandedPath] = useState<string | undefined>();
  const [path, setPath] = useState<string | undefined>();

  const [isLoading, setIsLoading] = useState(false);
  const [isExpandedLoading, setIsExpandedLoading] = useState(false);

  const addPanel = ({
    mainContent,
    expandedContent,
  }: {
    mainContent: { inputs?: InputParams; output?: string; path?: string };
    expandedContent?: { inputs?: InputParams; outputs?: string; path?: string };
  }) => {
    setPreviousPanels((previousValue) => [
      ...previousValue,
      {
        inputs,
        output,
        path,
        expandedInputs,
        expandedOutput,
        expandedPath,
      },
    ]);
    setMainContent(mainContent);
    setExpandedContent(
      expandedContent || {
        path: undefined,
        inputs: undefined,
        output: undefined,
      },
    );
  };

  const reset = () => {
    setPreviousPanels([]);
    setInputs(undefined);
    setOutput(undefined);
    setExpandedInputs(undefined);
    setExpandedOutput(undefined);
    setExpandedPath(undefined);
  };

  const setMainContent = ({
    path,
    inputs,
    output,
  }: {
    path?: string;
    inputs?: InputParams;
    output?: string;
  }) => {
    if (!path && !inputs && !output) {
      setInputs(undefined);
      setOutput(undefined);
    }
    if (path) setPath(path);
    if (inputs) setInputs(inputs);
    if (output) setOutput(output);
  };

  const setExpandedContent = ({
    path,
    inputs,
    output,
  }: {
    path?: string;
    inputs?: InputParams;
    output?: string;
  }) => {
    if (!path && !inputs && !output) {
      setExpandedInputs(undefined);
      setExpandedOutput(undefined);
    }
    if (path) setExpandedPath(path);
    if (inputs) setExpandedInputs(inputs);
    if (output) setExpandedOutput(output);
  };

  const goBack = useCallback(() => {
    const len = previousPanels.length - 1;
    const previous = previousPanels[len];

    setInputs(previous?.inputs);
    setOutput(previous?.output);
    setPath(previous?.path);
    setExpandedInputs(previous?.expandedInputs);
    setExpandedOutput(previous?.expandedOutput);
    setExpandedPath(previous?.expandedPath);

    setPreviousPanels((p) => {
      return p.slice(0, -1);
    });
  }, [previousPanels]);

  const showGoBackLink = useCallback(() => {
    return previousPanels.length > 0;
  }, [previousPanels]);

  return {
    mainContent: {
      inputs,
      output,
      path,
      isLoading,
      setIsLoading,
      set: setMainContent,
    },
    expandedContent: {
      inputs: expandedInputs,
      output: expandedOutput,
      path: expandedPath,
      isLoading: isExpandedLoading,
      setIsLoading: setIsExpandedLoading,
      set: setExpandedContent,
    },
    addPanel,
    reset,
    goBack,
    showGoBackLink,
    previousPanels,
  };
};
