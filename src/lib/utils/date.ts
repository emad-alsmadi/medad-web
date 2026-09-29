/** A calendar day, month 1–12. */
export interface DayParts {
  year: number;
  month: number;
  day: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate({ year, month, day }: DayParts): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The parts of an ISO `yyyy-mm-dd` date, or null when it is not a real day. */
export function parseIsoDate(value: string | null | undefined): DayParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isRealDay(parts) ? parts : null;
}

/** The parts of a `dd/mm/yyyy` date, or null when it is not a real day. */
export function parseDisplayDate(value: string): DayParts | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const parts = { year: Number(match[3]), month: Number(match[2]), day: Number(match[1]) };
  return isRealDay(parts) ? parts : null;
}

/** An ISO date shown day first (dd/mm/yyyy); anything else is returned unchanged. */
export function formatDate(value: string | null | undefined): string {
  const parts = parseIsoDate(value);
  return parts ? `${pad(parts.day)}/${pad(parts.month)}/${parts.year}` : (value ?? '');
}

function isRealDay({ year, month, day }: DayParts): boolean {
  const date = new Date(year, month - 1, day);
  return (
    year >= 1000 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
