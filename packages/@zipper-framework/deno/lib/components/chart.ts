// deno-lint-ignore-file no-explicit-any

export const BarChart = ({ ...props }: any) =>
  Zipper.Component.create({
    type: 'barChart',
    props: { ...props },
  });

export const LineChart = ({ ...props }: any) =>
  Zipper.Component.create({
    type: 'lineChart',
    props: { ...props },
  });
