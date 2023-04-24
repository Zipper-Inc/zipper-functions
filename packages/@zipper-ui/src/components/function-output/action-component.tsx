import { ActionButton } from './action-button';

export function ActionComponent({ action }: { action: Zipper.Action }) {
  switch (action.actionType) {
    default:
      return <ActionButton action={action} />;
  }
}
