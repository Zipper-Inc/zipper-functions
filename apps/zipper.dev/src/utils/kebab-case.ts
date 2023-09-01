export const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Convert camelCase to kebab-case
    .replace(/_/g, '-') // Convert snake_case to kebab-case
    .toLowerCase(); // Ensure all characters are in lowercase
