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
  const [output, setOutput] = useState<Record<string, string> | undefined>();
  const [expandedInputs, setExpandedInputs] = useState<InputParamWithValue[]>();
  const [expandedOutput, setExpandedOutput] = useState<
    Record<string, string> | undefined
  >();
  const [path, setPath] = useState<string>('main.ts');

  useEffect(() => {
    panels[currentPanelIndex] = {
      inputs,
      output,
      expandedInputs,
      expandedOutput,
      path,
    };
  }, [inputs, output, expandedInputs, expandedOutput, path]);

  useEffect(() => {
    if (panels[currentPanelIndex]) {
      setInputs(panels[currentPanelIndex]?.inputs);
      setOutput(panels[currentPanelIndex]?.output);
      setExpandedInputs(panels[currentPanelIndex]?.expandedInputs);
      setExpandedOutput(panels[currentPanelIndex]?.expandedOutput);
      setPath(panels[currentPanelIndex]!.path);
    }
  }, [currentPanelIndex]);

  const addPanel = () => {
    setCurrentPanelIndex(panels.length + 1);
    setPanels([...panels, { path: 'main.ts' }]);
  };

  return {
    inputs,
    setInputs,
    output,
    setOutput,
    expandedInputs,
    setExpandedInputs,
    expandedOutput,
    setExpandedOutput,
    path,
    setPath,
    addPanel,
  };
};
