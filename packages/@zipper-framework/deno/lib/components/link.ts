// deno-lint-ignore-file no-explicit-any

export const Link = ({ children, ...props }: any) =>
  Zipper.Component.create({
    type: 'link',
    props,
    children,
  });
