/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AppletContentReturnType,
  AppletContentPanel,
  InputParams,
  AppletOutput,
} from '@zipper/types';
import { useCallback, useEffect, useState } from 'react';

export const useAppletContent = (): AppletContentReturnType => {
  const [panelStack, setPanelStack] = useState<AppletContentPanel[]>([]);
  const [inputs, setInputs] = useState<InputParams>();
  const [output, setOutput] = useState<AppletOutput | undefined>();
  const [expandedInputs, setExpandedInputs] = useState<InputParams>();
  const [expandedOutput, setExpandedOutput] = useState<
    AppletOutput | undefined
  >();
  const [expandedPath, setExpandedPath] = useState<string | undefined>();
  const [path, setPath] = useState<string | undefined>();
  const [updatedAt, setUpdatedAt] = useState(Date.now());

  const [isLoading, setIsLoading] = useState(false);
  const [isExpandedLoading, setIsExpandedLoading] = useState(false);

  useEffect(() => {
    setUpdatedAt(Date.now());
  }, [
    output,
    inputs,
    path,
    isLoading,
    expandedOutput,
    expandedInputs,
    isExpandedLoading,
    expandedPath,
    panelStack,
  ]);

  useEffect(() => {
    console.log(path);
  }, [path]);

  const addPanel = ({
    mainContent,
    expandedContent,
  }: {
    mainContent: { inputs?: InputParams; output?: AppletOutput; path?: string };
    expandedContent?: {
      inputs?: InputParams;
      output?: AppletOutput;
      path?: string;
    };
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
    output?: AppletOutput;
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
    output?: AppletOutput;
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
    updatedAt,
  };
};
