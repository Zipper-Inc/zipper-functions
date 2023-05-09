/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AppletContentReturnType,
  AppletContentPanel,
  InputParams,
} from '@zipper/types';
import { useCallback, useState } from 'react';

export const useAppletContent = (): AppletContentReturnType => {
  const [panelStack, setPanelStack] = useState<AppletContentPanel[]>([]);
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
    setPanelStack((previousValue) => [
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
    setPanelStack([]);
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
    const len = panelStack.length - 1;
    const previous = panelStack[len];

    setInputs(previous?.inputs);
    setOutput(previous?.output);
    setPath(previous?.path);
    setExpandedInputs(previous?.expandedInputs);
    setExpandedOutput(previous?.expandedOutput);
    setExpandedPath(previous?.expandedPath);

    setPanelStack((p) => {
      return p.slice(0, -1);
    });
  }, [panelStack]);

  const showGoBackLink = useCallback(() => {
    return panelStack.length > 0;
  }, [panelStack]);

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
    panelStack,
  };
};
