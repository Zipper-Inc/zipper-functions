export const formatShortDate = (date: Date | undefined) => {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
  }).format(date);
};

export const formatDatetime = (date: Date | undefined) => {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'long',
  }).format(date);
};
