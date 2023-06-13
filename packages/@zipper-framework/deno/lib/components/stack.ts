// deno-lint-ignore-file no-explicit-any

export const Stack = ({ children, ...props }: any) =>
  Zipper.Component.create({ type: 'stack', props, children });

export const Row = ({ children, ...props }: any) =>
  Zipper.Component.create({
    type: 'stack',
    props: { ...props, direction: 'row' },
    children,
  });

export const Column = ({ children, ...props }: any) =>
  Zipper.Component.create({
    type: 'stack',
    props: { ...props, direction: 'column' },
    children,
  });
