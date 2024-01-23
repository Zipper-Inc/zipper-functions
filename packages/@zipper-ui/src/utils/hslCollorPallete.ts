export function genHslCollorPallet(cssVar: string) {
  return [50, 100, 200, 300, 400, 500, 600, 800, 900, 950].reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: `hsl(var(--${cssVar}-${curr}))`,
    }),
    {},
  );
}
