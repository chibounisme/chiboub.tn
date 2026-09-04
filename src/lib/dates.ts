export function formatPostDate(value: string, includeYear = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date);
}
