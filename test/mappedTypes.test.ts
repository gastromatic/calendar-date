import { CalendarDate, CalendarDateRange } from 'calendar-date';

// Mapped types such as Immer's Draft drop private members, so a class with a private instance
// member stops being assignable from its mapped copy. Like Draft, Mapped recurses into nested
// objects and leaves functions untouched. Only `tsc:check` can fail on the assignments below.
type Mapped<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { -readonly [K in keyof T]: Mapped<T[K]> }
    : T;

describe('mapped types', () => {
  test('CalendarDate and CalendarDateRange stay assignable from their mapped copies', () => {
    const range = new CalendarDateRange(
      new CalendarDate('2026-01-01'),
      new CalendarDate('2026-01-31'),
    );
    const mappedDate: Mapped<CalendarDate> = range.start;
    const mappedRange: Mapped<CalendarDateRange> = range;

    const date: CalendarDate = mappedDate;
    const copy: CalendarDateRange = mappedRange;

    expect(date).toBe(range.start);
    expect(copy).toBe(range);
  });
});
