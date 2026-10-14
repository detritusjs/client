export function toCamelCase(value: string): string {
  if (!value.includes('_')) {
    return value;
  }
  value = value
    .split('_')
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase())
    .join('');
  return value.charAt(0).toLowerCase() + value.slice(1);
}
