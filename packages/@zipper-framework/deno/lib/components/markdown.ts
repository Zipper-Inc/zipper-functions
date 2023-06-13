export const Markdown = ({ children, ...props }: any) =>
  Zipper.Component.create({
    type: 'markdown',
    props,
    children: props.text || children,
  });

export const md = (strings: TemplateStringsArray, ...expr: any[]) => {
  let children = '';
  strings.forEach((string, i) => {
    children += string + (expr[i]?.toString() || '');
  });
  return Markdown({ children });
};
