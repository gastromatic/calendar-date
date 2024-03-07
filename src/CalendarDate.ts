const DAY_IN_SECONDS = 86400;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export enum DayOfTheWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

export class CalendarDate {
  readonly year!: number;

  /**
   * Month of the year starting from 1
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
   * Day of the week starting from monday according to ISO 8601. Values from 1-7.
   */
  readonly weekday!: number;

  /**
   * Customizes the default string description for instances of `CalendarDate`.
   */
  get [Symbol.toStringTag]() {
    return 'CalendarDate';
  }

  /**
   * Throws an Error for invalid inputs.
   *
   * @param isoString Format: yyyy-MM-dd
   */
  constructor(isoString: string);

  /**
   * Throws an Error for invalid inputs.
   *
   * @param year Integer between 1-9999, other inputs may lead to unstable behaviour
   * @param month Integer between 1-12
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
      if (this.year < 0 || this.year > 9999) {
        throw new Error(
          `CalendarDate Validation Error: Input year ${this.year} is not valid. Year must be a number between 0 and 9999.`,
        );
      }
      if (this.month < 1 || this.month > 12) {
        throw new Error(
          `CalendarDate Validation Error: Input month ${this.month} is not valid. Month must be a number between 1 and 12.`,
        );
      }
      const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(this.year, this.month);
      if (this.day < 1) {
        throw new Error(
          `CalendarDate Validation Error: Input day ${this.day} is not valid. Day must be a number greater than 0.`,
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
    const date = new Date(`${this.toString()}T00:00:00.000Z`);
    this.unixTimestampInSeconds = date.getTime() / 1000;
    this.weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    Object.freeze(this);
  }

  public static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  public static getMaxDayOfMonth(year: number, month: number): number {
    return month === 2 && CalendarDate.isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  }

  /**
   * returns a CalendarDate instance for the supplied Date, using UTC values
   */
  static fromDateUTC(date: Date): CalendarDate {
    return new CalendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  /**
   * returns a CalendarDate instance for the supplied Date, using local time zone values
   */
  static fromDateLocal(date: Date): CalendarDate {
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  /**
   * returns a CalendarDate instance for the supplied Date, using the supplied time zone string
   */
  static fromDateWithTimeZone(date: Date, timeZone: string): CalendarDate {
    const calendarValues = date
      .toLocaleDateString('de-DE', { timeZone })
      .split('.')
      .map((value) => parseInt(value));
    return new CalendarDate(calendarValues[2], calendarValues[1], calendarValues[0]);
  }

  /**
   * returns a CalendarDate instance for the current UTC Date
   */
  static nowUTC(): CalendarDate {
    return CalendarDate.fromDateUTC(new Date());
  }

  /**
   * returns a CalendarDate instance for the current Date using the local time zone of your environment
   */
  static nowLocal(): CalendarDate {
    return CalendarDate.fromDateLocal(new Date());
  }

  /**
   * returns a CalendarDate instance for the current Date using the supplied time zone string
   */
  static nowTimeZone(timeZone: string): CalendarDate {
    return CalendarDate.fromDateWithTimeZone(new Date(), timeZone);
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
    return new CalendarDate(parseInt(split[0]), parseInt(split[1]), parseInt(split[2]));
  }

  static max(...values: CalendarDate[]): CalendarDate {
    if (!values.length) {
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
    if (!values.length) {
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
   * Returns a copy of the supplied array of CalendarDates sorted ascending
   */
  static sortAscending(calendarDates: CalendarDate[]): CalendarDate[] {
    return [...calendarDates].sort((a, b) => a.valueOf() - b.valueOf());
  }

  /**
   * Returns a copy of the supplied array of CalendarDates sorted descending
   */
  static sortDescending(calendarDates: CalendarDate[]): CalendarDate[] {
    return [...calendarDates].sort((a, b) => b.valueOf() - a.valueOf());
  }

  /**
   * Returns the ISO string representation yyyy-MM-dd
   */
  toString(): string {
    return `${this.year.toString().padStart(4, '0')}-${this.month
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
  toFormat(pattern: string): string;

  /**
   * Returns a string representation formatted with the Intl.DateTimeFormat API.
   */
  toFormat(
    locales: string,
    options: Pick<Intl.DateTimeFormatOptions, 'year' | 'month' | 'day' | 'weekday'>,
  ): string;

  toFormat(
    input: string,
    options?: Pick<Intl.DateTimeFormatOptions, 'year' | 'month' | 'day' | 'weekday'>,
  ): string {
    if (options) {
      const formatter = new Intl.DateTimeFormat(input, options);
      return formatter.format(new Date(this.year, this.month - 1, this.day));
    } else {
      return input
        .replace(/yyyy/g, this.year.toString().padStart(4, '0'))
        .replace(/yy/g, this.year.toString().slice(-2).padStart(2, '0'))
        .replace(/y/g, this.year.toString())
        .replace(/MM/g, this.month.toString().padStart(2, '0'))
        .replace(/M/g, this.month.toString())
        .replace(/dd/g, this.day.toString().padStart(2, '0'))
        .replace(/d/g, this.day.toString());
    }
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

  isBefore(calendarDate: CalendarDate): boolean {
    return this.valueOf() < calendarDate.valueOf();
  }

  isAfter(calendarDate: CalendarDate): boolean {
    return this.valueOf() > calendarDate.valueOf();
  }

  isBeforeOrEqual(calendarDate: CalendarDate): boolean {
    return this.valueOf() <= calendarDate.valueOf();
  }

  isAfterOrEqual(calendarDate: CalendarDate): boolean {
    return this.valueOf() >= calendarDate.valueOf();
  }

  /**
   * Returns a new CalendarDate with the specified amount of months added.
   *
   * @param amount
   * @param enforceEndOfMonth If set to true the addition will never cause an overflow to the next month.
   */
  addMonths(amount: number, enforceEndOfMonth = false): CalendarDate {
    const totalMonths = this.month + amount - 1;
    let year = this.year + Math.floor(totalMonths / 12);
    let month = totalMonths % 12;
    let day = this.day;
    if (month < 0) {
      month = (month + 12) % 12;
    }
    const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, month + 1);
    if (enforceEndOfMonth) {
      day = Math.min(maxDayOfMonth, day);
    } else if (day > maxDayOfMonth) {
      day = day - maxDayOfMonth;
      year = year + Math.floor((month + 1) / 12);
      month = (month + 1) % 12;
    }
    return new CalendarDate(year, month + 1, day);
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
   * returns the last day (sunday) of the week of this calendar date as a new calendar date object.
   */
  getLastDayOfWeek(): CalendarDate {
    return this.addDays(7 - this.weekday);
  }

  /**
   * returns the first day (monday) of the week of this calendar date as a new calendar date object.
   */
  getFirstDayOfWeek(): CalendarDate {
    return this.addDays(-(this.weekday - 1));
  }

  /**
   * returns true if the weekday is monday(1)
   */
  isFirstDayOfWeek(): boolean {
    return this.weekday === 1;
  }

  /**
   * returns true if the weekday is sunday(7)
   */
  isLastDayOfWeek(): boolean {
    return this.weekday === 7;
  }

  /**
   * subtracts the input CalendarDate from this CalendarDate and returns the difference in days
   */
  getDifferenceInDays(calendarDate: CalendarDate, absolute?: boolean): number {
    const days = (this.valueOf() - calendarDate.valueOf()) / DAY_IN_SECONDS;
    return absolute ? Math.abs(days) : days;
  }

  /**
   * The number of the week of the year that the day is in. By definition (ISO 8601), the first week of a year contains January 4 of that year.
   * (The ISO-8601 week starts on Monday.) In other words, the first Thursday of a year is in week 1 of that year. (for timestamp values only).
   * [source: https://www.postgresql.org/docs/8.1/functions-datetime.html]
   */
  public get week(): number {
    return CalendarDate.getWeekNumber(this.year, this.month, this.day);
  }

  /**
   * Source: https://weeknumber.com/how-to/javascript
   */
  private static getWeekNumber(year: number, month: number, day: number): number {
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return (
      1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
      )
    );
  }
}
