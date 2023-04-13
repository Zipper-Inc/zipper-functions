import { ActionButton } from './action-button';
import { FunctionOutputProps } from './types';

export function ActionComponent({
  action,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
}: Omit<FunctionOutputProps, 'result'> & { action: Zipper.Action }) {
  switch (action.actionType) {
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
