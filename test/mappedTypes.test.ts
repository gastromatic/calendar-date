import { CalendarDate, CalendarDateRange } from 'calendar-date';

// Mapped types such as Immer's Draft drop private members, so a class with a private instance
// member stops being assignable from its mapped copy.
type Mapped<T> = { -readonly [K in keyof T]: T[K] };

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
