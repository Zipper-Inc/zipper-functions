import { ActionButton } from './action-button';
import { ActionDropdown } from './action-dropdown';
import { ActionLink } from './action-link';

export function ActionComponent({ action }: { action: Zipper.Action }) {
  switch (action.actionType) {
    case 'dropdown':
      return <ActionDropdown action={action} />;
    case 'link':
      return <ActionLink action={action} />;
    case 'button':
    default:
      return <ActionButton action={action} />;
  }
}
