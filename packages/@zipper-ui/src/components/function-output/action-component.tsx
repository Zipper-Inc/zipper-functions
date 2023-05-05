import { ActionButton } from './action-button';
import { ActionDropdown } from './action-dropdown';

export function ActionComponent({ action }: { action: Zipper.Action }) {
  switch (action.actionType) {
    case 'dropdown':
      return <ActionDropdown action={action} />;
    case 'button':
      return <ActionButton action={action} />;
    default:
      return <ActionButton action={action} />;
  }
}
