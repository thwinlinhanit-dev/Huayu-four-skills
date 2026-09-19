/* Real streak engine — derived from the user's practice history.
   A streak is only meaningful when it's earned (consecutive active days). */

export const DAY_MS = 86_400_000;

/** YYYY-MM-DD for a given date (local timezone) */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function yesterday(key: string): string {
  return addDays(key, -1);
}

export function todayKey(): string {
  return dayKey(new Date());
}

/** Number of calendar days from date a to date b (positive when b is after a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / DAY_MS);
}

export interface StreakResult {
  current: number;
  longest: number;
  /** true when today is already registered (streak "banked" for today) */
  practicedToday: boolean;
}

/**
 * Compute current + longest streak from an array of active day keys (YYYY-MM-DD).
 * The current streak counts consecutive days ending today; if today was missed
 * but yesterday was active, the streak is still alive (one-day grace is implied
 * by only counting days ending *at or near* today).
 */
export function computeStreak(activeDates: string[], today: string = todayKey()): StreakResult {
  const set = new Set(activeDates);

  // Longest run through sorted unique dates
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  // Current streak: walk backwards from today (or yesterday if today not yet practiced)
  let current = 0;
  let practicedToday = set.has(today);
  let cursor = practicedToday ? today : yesterday(today);
  while (set.has(cursor)) {
    current++;
    cursor = yesterday(cursor);
  }

  return { current, longest, practicedToday };
}

/** Insert a day key, keeping the list sorted and bounded. Returns new list + whether it was new. */
export function addActiveDate(activeDates: string[], date: string, maxDays: number = 3660): { activeDates: string[]; isNew: boolean } {
  if (activeDates.includes(date)) return { activeDates, isNew: false };
  const next = [...activeDates, date].sort();
  const trimmed = next.length > maxDays ? next.slice(next.length - maxDays) : next;
  return { activeDates: trimmed, isNew: true };
}