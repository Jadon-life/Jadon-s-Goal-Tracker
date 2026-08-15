// Shared logic for Jadon's Goal Tracker "smart reminders":
// given a goal's target date, we remind the user on a handful of days
// counting down to it (e.g. 3, 2, 1 days before + the due date itself),
// all at one base time of day. The base time defaults to a random
// (but sane, daytime) value the first time a target date is set, and can
// always be edited afterward, same for which days-before are included.

export const DEFAULT_DAYS_BEFORE = [3, 2, 1, 0];

export const DAY_OFFSET_OPTIONS = [7, 5, 3, 2, 1, 0];

export function dayOffsetLabel(offset: number): string {
  if (offset === 0) return "Due date";
  if (offset === 1) return "1 day before";
  return `${offset} days before`;
}

// Returns a random "HH:MM" (24h) string, snapped to 5-minute steps,
// biased to a normal waking-hours window (8:00 AM - 9:00 PM) so the
// generic default is never an absurd 3am reminder.
export function randomReminderTime(): string {
  const startMinutes = 8 * 60; // 08:00
  const endMinutes = 21 * 60; // 21:00
  const step = 5;
  const steps = Math.floor((endMinutes - startMinutes) / step);
  const randomStep = Math.floor(Math.random() * steps);
  const totalMinutes = startMinutes + randomStep * step;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseDaysBefore(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0)
    .sort((a, b) => b - a);
}

export function formatDaysBefore(days: number[]): string {
  return Array.from(new Set(days))
    .filter((n) => n >= 0)
    .sort((a, b) => b - a)
    .join(",");
}

export function formatTime12h(time: string): string {
  if (!time || !time.includes(":")) return time;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

export interface ScheduledReminder {
  date: Date;
  offset: number;
}

// Computes the actual Date/time for each auto-reminder, given a target
// date (YYYY-MM-DD), a base "HH:MM" time, and the list of day-offsets.
// Only reminders that fall in the future are returned (nothing gets
// scheduled for a moment that has already passed).
export function computeScheduledReminders(
  targetDate: string,
  time: string,
  daysBefore: number[]
): ScheduledReminder[] {
  if (!targetDate || !time) return [];
  const [year, month, day] = targetDate.split("-").map((n) => parseInt(n, 10));
  const [hour, minute] = time.split(":").map((n) => parseInt(n, 10));
  if (!year || !month || !day || isNaN(hour) || isNaN(minute)) return [];

  const now = new Date();
  const results: ScheduledReminder[] = [];

  for (const offset of daysBefore) {
    const d = new Date(year, month - 1, day, hour, minute, 0, 0);
    d.setDate(d.getDate() - offset);
    if (d.getTime() > now.getTime()) {
      results.push({ date: d, offset });
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function messageForOffset(goalTitle: string, offset: number): string {
  if (offset === 0) return `Due today: "${goalTitle}"`;
  if (offset === 1) return `Due tomorrow: "${goalTitle}"`;
  return `Due in ${offset} days: "${goalTitle}"`;
}
