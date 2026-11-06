// Shown in Lagos time whatever the admin's computer is set to.
export function formatCallTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}
