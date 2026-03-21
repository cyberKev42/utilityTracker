export function normalizeDecimal(value) {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(',', '.');
}
