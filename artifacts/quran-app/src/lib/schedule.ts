/** One entry in the 365-day Quran memorisation schedule. */
export interface DayEntry {
  day: number;
  startPage: number;
  endPage: number;
}

let _cache: DayEntry[] | null = null;

/**
 * Build (and cache) the full 365-day schedule.
 * Days  1–239 → 2 pages/day  (478 pages)
 * Days 240–365 → 1 page/day  (126 pages)
 * Total = 604 pages (the Mushaf).
 */
export function buildSchedule(): DayEntry[] {
  if (_cache) return _cache;
  const schedule: DayEntry[] = [];
  let page = 1;
  for (let day = 1; day <= 365; day++) {
    const count = day <= 239 ? 2 : 1;
    const end   = Math.min(page + count - 1, 604);
    schedule.push({ day, startPage: page, endPage: end });
    page = end + 1;
    if (page > 604) break;
  }
  _cache = schedule;
  return schedule;
}

/**
 * Return today's day-number (1–365) based on the program start date.
 * Returns null if the program hasn't started yet.
 */
export function getCurrentDay(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diff, 1), 365);
}

/** Percentage of the year completed (0–100). */
export function yearProgress(day: number): number {
  return Math.round((day / 365) * 100);
}
