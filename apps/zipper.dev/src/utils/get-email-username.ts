export function getEmailUsername(email: string) {
  const match = email.match(/([^@]*)@/);

  if (match && match.length > 1) {
    return match[1];
  } else {
    return '';
  }
}
