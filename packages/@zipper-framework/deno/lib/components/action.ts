// deno-lint-ignore-file no-explicit-any

export const Button = ({ children, ...props }: any) =>
  Zipper.Action.create({
    actionType: 'button',
    ...props,
    text: children?.toString ? children.toString() : JSON.stringify(children),
  });

export const Dropdown = (props: any) =>
  Zipper.Action.create({
    actionType: 'dropdown',
    ...props,
  });
