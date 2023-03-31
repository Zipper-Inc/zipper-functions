export const getAppLink = (slug: string) => {
  return `${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`;
};
