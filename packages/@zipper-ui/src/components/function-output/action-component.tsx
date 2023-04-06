import { ActionButton } from './action-button';
import { FunctionOutputProps } from './types';

export type Action = {
  action_type: string;
  text: string;
  script: string;
  show_as: 'modal' | 'expanded' | 'replace_all';
  inputs: Record<string, any>;
};

export function ActionComponent({
  action,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
}: Omit<FunctionOutputProps, 'result'> & { action: Action }) {
  switch (action.action_type) {
    default:
      return (
        <ActionButton
          action={action}
          setExpandedResult={setExpandedResult}
          setModalResult={setModalResult}
          setOverallResult={setOverallResult}
          getRunUrl={getRunUrl}
        />
      );
  }
}
