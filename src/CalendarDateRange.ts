import { CalendarDate } from './CalendarDate';

export class CalendarDateRange {
  readonly start: CalendarDate;

  readonly end: CalendarDate;

  constructor(start: CalendarDate, end: CalendarDate, autoArrange = false) {
    if (!autoArrange && end < start) {
      throw new Error(
        "CalendarDateRange Validation Error: end date can't be before the start date.",
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

  /**
   * Returns true if the given date ranges have gaps.
   * The date ranges will be sorted.
   */
  static hasGaps(
    values: CalendarDateRange[],
    options?: { excludeStart?: boolean; excludeEnd?: boolean },
  ): boolean {
    const sortedValues = values.sort((a, b) => a.start.valueOf() - b.start.valueOf());
    for (let i = 1; i < sortedValues.length; i++) {
      let differenceInDays = sortedValues[i].start.getDifferenceInDays(sortedValues[i - 1].end);
      if (options?.excludeStart) {
        differenceInDays += 1;
      }
      if (options?.excludeEnd) {
        differenceInDays += 1;
      }
      if (differenceInDays > 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if the given date ranges overlap.
   * The date ranges will be sorted.
   */
  static hasOverlap(
    values: CalendarDateRange[],
    options?: { excludeStart?: boolean; excludeEnd?: boolean },
  ): boolean {
    const sortedValues = values.sort((a, b) => a.start.valueOf() - b.start.valueOf());
    for (let i = 1; i < sortedValues.length; i++) {
      let differenceInDays = sortedValues[i].start.getDifferenceInDays(sortedValues[i - 1].end);
      if (options?.excludeStart) {
        differenceInDays += 1;
      }
      if (options?.excludeEnd) {
        differenceInDays += 1;
      }
      if (differenceInDays <= 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the total amount of days in included in this date range
   * including start and end day.
   */
  getTotalDays(): number {
    return this.end.getDifferenceInDays(this.start) + 1;
  }

  /**
   * Returns the difference in days between the start and end date.
   * See documentation of CalendarDate.getDifferenceInDays for more information.
   */
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
