const DAY_IN_SECONDS = 86400;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export class CalendarDate {
  readonly year!: number;

  /**
   * Month of the year starting from 0
   */
  readonly month!: number;

  /**
   * Day of the month starting from 1
   */
  readonly day!: number;

  /**
   * Seconds passed since the unix epoch. Always calculated with a time and timezone set to T00:00:00.00Z.
   */
  readonly unixTimestampInSeconds!: number;

  /**
   * Throws an Error for invalid inputs.
   *
   * @param isoString Format: yyyy-MM-dd
   */
  constructor(isoString: string);

  /**
   * Throws an Error for invalid inputs.
   *
   * @param year Integer between 1 - 9999, other inputs may lead to unstable behaviour
   * @param month Integer between 0-11
   * @param day Integer between 1-31
   */
  constructor(year: number, month: number, day: number);

  constructor(input1: string | number, input2?: number, input3?: number) {
    if (typeof input1 === 'string') {
      return CalendarDate.parse(input1);
    }
    if (typeof input2 === 'number' && typeof input3 === 'number') {
      this.year = input1;
      this.month = input2;
      this.day = input3;
      if (!Number.isInteger(this.year) || this.year < 0 || this.year > 9999) {
        throw new Error(
          `CalendarDate Validation Error: Input year ${this.year} is not valid. Year must be an integer between 0 and 9999.`,
        );
      }
      if (!Number.isInteger(this.month) || this.month < 0 || this.month > 11) {
        throw new Error(
          `CalendarDate Validation Error: Input month ${this.month} is not valid. Month must be an integer between 0 and 11.`,
        );
      }
      const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(this.year, this.month);
      if (!Number.isInteger(this.day) || this.day < 1) {
        throw new Error(
          `CalendarDate Validation Error: Input day ${this.day} is not valid. Day must be an integer greater than 0.`,
        );
      }
      if (this.day > maxDayOfMonth) {
        throw new Error(
          `CalendarDate Validation Error: Input date ${this.year}-${this.month}-${this.day} is not a valid calendar date.`,
        );
      }
    } else {
      throw new Error(
        `CalendarDate Validation Error: Input [ ${[input1, input2, input3]
          .filter((input) => input !== undefined)
          .join(' , ')} ] is not valid.`,
      );
    }
    this.unixTimestampInSeconds = new Date(`${this.toString()}T00:00:00.000Z`).getTime() / 1000;
    Object.freeze(this);
  }

  public static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  public static getMaxDayOfMonth(year: number, month: number): number {
    return month === 1 && CalendarDate.isLeapYear(year) ? 29 : DAYS_IN_MONTH[month];
  }

  /**
   *
   * @param isoString pattern YYYY-MM-DD
   */
  static parse(isoString: string): CalendarDate {
    if (!isoString.match(new RegExp(/^\d{4}-\d{2}-\d{2}$/))) {
      throw new Error(
        `CalendarDate Validation Error: Input ${isoString.toString()} is not valid, it should follow the pattern YYYY-MM-DD.`,
      );
    }
    const split = isoString.split('-');
    return new CalendarDate(parseInt(split[0]), parseInt(split[1]) - 1, parseInt(split[2]));
  }

  static max(...values: CalendarDate[]): CalendarDate {
    if (!values?.length) {
      throw new Error(
        'CalendarDate.max Validation Error: Function max requires at least one input argument.',
      );
    }
    return values.reduce(
      (maxValue, currentValue) => (currentValue > maxValue ? currentValue : maxValue),
      values[0],
    );
  }

  static min(...values: CalendarDate[]): CalendarDate {
    if (!values?.length) {
      throw new Error(
        'CalendarDate.min Validation Error: Function min requires at least one input argument.',
      );
    }
    return values.reduce(
      (minValue, currentValue) => (currentValue < minValue ? currentValue : minValue),
      values[0],
    );
  }

  /**
   * Returns the ISO string representation yyyy-MM-dd
   */
  toString(): string {
    return `${this.year.toString().padStart(4, '0')}-${(this.month + 1)
      .toString()
      .padStart(2, '0')}-${this.day.toString().padStart(2, '0')}`;
  }

  /**
   * Returns a string representation formatted according to the specified format string.
   * Supports the following Tokens:
   *
   * - **yyyy**: four digit year
   * - **yy**: two digit year
   * - **y**: year without padding
   * - **MM**: month padded to 2 digits
   * - **M**: month without padding
   * - **dd**: day padded to 2 digits
   * - **d**: day without padding
   *
   */
  toFormat(pattern: string): string {
    return pattern
      .replace(/yyyy/g, this.year.toString().padStart(4, '0'))
      .replace(/yy/g, this.year.toString().slice(-2).padStart(2, '0'))
      .replace(/y/g, this.year.toString())
      .replace(/MM/g, (this.month + 1).toString().padStart(2, '0'))
      .replace(/M/g, (this.month + 1).toString())
      .replace(/dd/g, this.day.toString().padStart(2, '0'))
      .replace(/d/g, this.day.toString());
  }

  /**
   * Used by JSON stringify method.
   */
  toJSON(): string {
    return this.toString();
  }

  toDate(): Date {
    return new Date(this.unixTimestampInSeconds * 1000);
  }

  /**
   * Returns the unix timestamp in seconds.
   */
  valueOf(): number {
    return this.unixTimestampInSeconds;
  }

  equals(calendarDate: CalendarDate): boolean {
    return this.valueOf() === calendarDate.valueOf();
  }

  /**
   * Returns a new CalendarDate with the specified amount of months added.
   *
   * @param amount
   * @param enforceEndOfMonth If set to true the addition will never cause an overflow to the next month.
   */
  addMonths(amount: number, enforceEndOfMonth = false): CalendarDate {
    const totalMonths = this.month + amount;
    let year = this.year + Math.floor(totalMonths / 12);
    let month = totalMonths % 12;
    let day = this.day;
    if (month < 0) {
      month = (month + 12) % 12;
    }
    const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, month);
    if (enforceEndOfMonth) {
      day = Math.min(maxDayOfMonth, day);
    } else if (day > maxDayOfMonth) {
      day = day - maxDayOfMonth;
      year = year + Math.floor((month + 1) / 12);
      month = (month + 1) % 12;
    }
    return new CalendarDate(year, month, day);
  }

  /**
   * Returns a new CalendarDate with the specified amount of days added.
   * Allows overflow.
   */
  addDays(amount: number): CalendarDate {
    return CalendarDate.parse(
      new Date((this.valueOf() + DAY_IN_SECONDS * amount) * 1000).toISOString().slice(0, 10),
    );
  }

  getLastDayOfMonth(): CalendarDate {
    return new CalendarDate(
      this.year,
      this.month,
      CalendarDate.getMaxDayOfMonth(this.year, this.month),
    );
  }

  getFirstDayOfMonth(): CalendarDate {
    return new CalendarDate(this.year, this.month, 1);
  }

  isFirstDayOfMonth(): boolean {
    return this.day === 1;
  }

  isLastDayOfMonth(): boolean {
    return this.day === CalendarDate.getMaxDayOfMonth(this.year, this.month);
  }

  /**
   * subtracts the input CalendarDate from this CalendarDate and returns the difference in days
   */
  getDifferenceInDays(calendarDate: CalendarDate, absolute?: boolean): number {
    const days = (this.valueOf() - calendarDate.valueOf()) / DAY_IN_SECONDS;
    return absolute ? Math.abs(days) : days;
  }
}
