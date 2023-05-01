import { InputParams } from '@zipper/types';
import { useEffect, useState } from 'react';

type AppletPanel = {
  inputs?: InputParams;
  output?: string;
  expandedInputs?: InputParams;
  expandedOutput?: string;
};

export const useApplet = () => {
  const [panels, setPanels] = useState<AppletPanel[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [inputs, setInputs] = useState<InputParams | undefined>();
  const [output, setOutput] = useState<string | undefined>();
  const [expandedInputs, setExpandedInputs] = useState<
    InputParams | undefined
  >();
  const [expandedOutput, setExpandedOutput] = useState<string | undefined>();

  useEffect(() => {
    panels[currentPanelIndex] = {
      inputs,
      output,
      expandedInputs,
      expandedOutput,
    };
  }, [inputs, output, expandedInputs, expandedOutput]);

  useEffect(() => {
    setInputs(panels[currentPanelIndex]?.inputs);
    setOutput(panels[currentPanelIndex]?.output);
    setExpandedInputs(panels[currentPanelIndex]?.expandedInputs);
    setExpandedOutput(panels[currentPanelIndex]?.expandedOutput);
  }, [currentPanelIndex]);

  const addPanel = () => {
    setCurrentPanelIndex(panels.length + 1);
    setPanels([...panels, {}]);
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
    addPanel,
  };
};
