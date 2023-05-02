/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AppletReturnType,
  AppletPanel,
  InputParamWithValue,
} from '@zipper/types';
import { useEffect, useState } from 'react';

export const useApplet = (): AppletReturnType => {
  const [panels, setPanels] = useState<AppletPanel[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [inputs, setInputs] = useState<InputParamWithValue[]>();
  const [output, setOutput] = useState<string | undefined>();
  const [expandedInputs, setExpandedInputs] = useState<InputParamWithValue[]>();
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

  const addPanel = (path: string) => {
    setCurrentPanelIndex(panels.length + 1);
    setPanels([...panels, { path }]);
  };

  const reset = () => {
    setPanels([]);
    setCurrentPanelIndex(0);
  };

  return {
    inputs,
    setInputs,
    output,
    setOutput,
    path,
    setPath,
    expandedInputs,
    setExpandedInputs,
    expandedOutput,
    setExpandedOutput,
    expandedPath,
    setExpandedPath,
    addPanel,
    reset,
    isLoading,
    setIsLoading,
    isExpandedLoading,
    setIsExpandedLoading,
  };
};
