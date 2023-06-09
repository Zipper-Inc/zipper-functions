export const Link = ({
  children,
  ...props
}: Zipper.LinkComponent['props'] & {
  children: Zipper.LinkComponent['children'];
}) =>
  Zipper.Component.create({
    type: 'link',
    props,
    children,
  });

window.Link = Link;
