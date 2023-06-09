type Props = Zipper.StackComponent['props'] & {
  children: Zipper.StackComponent['children'];
};

declare global {
  export function Stack(props: Props): Zipper.Component;
  export function Row(props?: Props): Zipper.Component;
  export function Column(props?: Props): Zipper.Component;
}

export const Stack = ({ children, ...props }: Props | undefined) =>
  Zipper.Component.create({ type: 'stack', props, children });

export const Row = ({ children, ...props }: Props | undefined) =>
  Zipper.Component.create({
    type: 'stack',
    props: { ...props, direction: 'row' },
    children,
  });

export const Column = ({
  children,
  ...props
}: Zipper.StackComponent['props'] & {
  children: Zipper.StackComponent['children'];
}) =>
  Zipper.Component.create({
    type: 'stack',
    props: { ...props, direction: 'column' },
    children,
  });

window.Stack = Stack;
window.Row = Row;
window.Column = Column;
