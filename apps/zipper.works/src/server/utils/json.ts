export const filterTokenFields = (json: Record<string, any>) => {
  return JSON.parse(
    JSON.stringify(json, (k, v) => (k.includes('token') ? undefined : v)),
  );
};
