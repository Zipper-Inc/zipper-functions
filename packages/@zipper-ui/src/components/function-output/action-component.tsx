import { ActionButton } from './action-button';
import { ActionDropdown } from './action-dropdown';

export function ActionComponent({
  action: _action,
}: {
  action: Zipper.Action;
}) {
  const action = _action;
  if (action.run === undefined || action.run === null) action.run = true;

  switch (action.actionType) {
    case 'dropdown':
      return <ActionDropdown action={action} />;
    case 'button':
    default:
      return <ActionButton action={action} />;
  }
}
