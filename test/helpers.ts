import { CalendarDate } from 'calendar-date';

export const DAY_IN_SECONDS = 86400;

export function ensureValidDay(year: number, month: number, day: number): number {
  return Math.max(1, Math.min(day, CalendarDate.getMaxDayOfMonth(year, month)));
}

export function unixTimestampToCalendarDate(timestamp: number): CalendarDate {
  return CalendarDate.parse(new Date(timestamp * 1000).toISOString().slice(0, 10));
}
