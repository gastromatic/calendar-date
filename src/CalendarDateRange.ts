import { CalendarDate } from './CalendarDate';

export class CalendarDateRange {
  readonly start: CalendarDate;

  readonly end: CalendarDate;

  constructor(start: CalendarDate, end: CalendarDate, autoArrange = false) {
    if (!autoArrange && end < start) {
      throw new Error(
        "CalendarDateRange Validation Error: start date can't be before the end date.",
      );
    }
    this.start = start <= end ? start : end;
    this.end = end > start ? end : start;
    Object.freeze(this);
  }

  equals(calendarDateRange: CalendarDateRange): boolean {
    return this.start.equals(calendarDateRange.start) && this.end.equals(calendarDateRange.end);
  }

  toString(): string {
    return `${this.start.toString()}/${this.end.toString()}`;
  }

  toJSON(): string {
    return this.toString();
  }

  /**
   * @param isoString pattern YYYY-MM-DD/YYYY-MM-DD
   */
  static parse(isoString: string): CalendarDateRange {
    const split = isoString.split('/');
    if (split.length !== 2) {
      throw new Error(
        `CalendarDateRange Validation Error: Input ${isoString.toString()} is not valid, it should follow the pattern YYYY-MM-DD/YYYY-MM-DD.`,
      );
    }
    return new CalendarDateRange(new CalendarDate(split[0]), new CalendarDate(split[1]));
  }

  getDifferenceInDays(): number {
    return this.end.getDifferenceInDays(this.start);
  }

  /**
   * Returns the difference in months as an integer, ignoring the day values.
   */
  getDifferenceInMonths(): number {
    return (this.end.year - this.start.year) * 12 + (this.end.month - this.start.month);
  }

  includes(
    calendarDate: CalendarDate,
    options?: { excludeStart?: boolean; excludeEnd?: boolean },
  ): boolean;

  includes(
    calendarDateRange: CalendarDateRange,
    options?: { excludeStart?: boolean; excludeEnd?: boolean },
  ): boolean;

  includes(
    input: CalendarDate | CalendarDateRange,
    options?: { excludeStart?: boolean; excludeEnd?: boolean },
  ): boolean {
    if (input instanceof CalendarDateRange) {
      return this.includes(input.start, options) && this.includes(input.end, options);
    }
    return (
      (options?.excludeStart ? input > this.start : input >= this.start) &&
      (options?.excludeEnd ? input < this.end : input <= this.end)
    );
  }
}
