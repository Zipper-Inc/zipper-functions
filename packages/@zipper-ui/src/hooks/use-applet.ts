/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AppletContentReturnType,
  AppletContentPanel,
  InputParams,
} from '@zipper/types';
import { useEffect, useState } from 'react';

export const useAppletContent = (): AppletContentReturnType => {
  const [panels, setPanels] = useState<AppletContentPanel[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [inputs, setInputs] = useState<InputParams>();
  const [output, setOutput] = useState<string | undefined>();
  const [expandedInputs, setExpandedInputs] = useState<InputParams>();
  const [expandedOutput, setExpandedOutput] = useState<string | undefined>();
  const [expandedPath, setExpandedPath] = useState<string | undefined>();
  const [path, setPath] = useState<string>('main.ts');

  const [isLoading, setIsLoading] = useState(false);
  const [isExpandedLoading, setIsExpandedLoading] = useState(false);

  useEffect(() => {
    panels[currentPanelIndex] = {
      inputs,
      output,
      path,
      expandedInputs,
      expandedOutput,
      expandedPath,
    };
  }, [inputs, output, path, expandedInputs, expandedOutput, expandedPath]);

  useEffect(() => {
    if (panels[currentPanelIndex]) {
      setInputs(panels[currentPanelIndex]?.inputs);
      setOutput(panels[currentPanelIndex]?.output);
      setPath(panels[currentPanelIndex]!.path);
      setExpandedInputs(panels[currentPanelIndex]?.expandedInputs);
      setExpandedOutput(panels[currentPanelIndex]?.expandedOutput);
      setExpandedPath(panels[currentPanelIndex]!.expandedPath);
    }
  }, [currentPanelIndex]);

  const addPanel = ({
    inputs,
    output,
    path,
  }: {
    path: string;
    inputs?: InputParams;
    output?: string;
  }) => {
    setPanels((panels) => {
      setCurrentPanelIndex(panels.length);
      return [...panels, { path, inputs, output }];
    });
  };

  const reset = () => {
    setPanels([]);
    setCurrentPanelIndex(0);
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
    if (path) setExpandedPath(path);
    if (inputs) setExpandedInputs(inputs);
    if (output) setExpandedOutput(output);
  };

  const goBack = () => {
    setCurrentPanelIndex((currentPanelIndex) => {
      const remainingPanels = panels;
      remainingPanels.pop();
      setPanels(remainingPanels);
      return currentPanelIndex - 1;
    });
  };

  const numberOfPanels = () => panels.length;

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
    numberOfPanels,
  };
};
