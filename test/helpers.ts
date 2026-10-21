import * as fc from 'fast-check';
import { CalendarDate, CalendarDateRange } from 'calendar-date';

export const DAY_IN_SECONDS = 86400;

type YearOptions = { minYear?: number; maxYear?: number };

export function ensureValidDay(year: number, month: number, day: number): number {
  return Math.max(1, Math.min(day, CalendarDate.getMaxDayOfMonth(year, month)));
}

/**
 * Generates valid CalendarDates between January 1 of minYear and December 31 of maxYear (1-9999 by
 * default). Built from year, month and day so that it does not depend on the arithmetic under test.
 */
export function calendarDateArbitrary({
  minYear = 1,
  maxYear = 9999,
}: YearOptions = {}): fc.Arbitrary<CalendarDate> {
  return fc
    .tuple(
      fc.integer({ min: minYear, max: maxYear }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 31 }),
    )
    .map(([year, month, day]) => new CalendarDate(year, month, ensureValidDay(year, month, day)));
}

/**
 * Generates an array of the given length with CalendarDates sorted ascending. Dates can repeat.
 */
export function sortedCalendarDatesArbitrary(
  length: number,
  options: YearOptions = {},
): fc.Arbitrary<CalendarDate[]> {
  return fc
    .array(calendarDateArbitrary(options), { minLength: length, maxLength: length })
    .map((dates) => [...dates].sort((a, b) => a.valueOf() - b.valueOf()));
}

/**
 * Generates CalendarDateRanges with both dates between January 1 of minYear and December 31 of maxYear.
 */
export function calendarDateRangeArbitrary(
  options: YearOptions = {},
): fc.Arbitrary<CalendarDateRange> {
  return sortedCalendarDatesArbitrary(2, options).map(
    ([start, end]) => new CalendarDateRange(start, end),
  );
}
