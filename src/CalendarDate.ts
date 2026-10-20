const DAY_IN_SECONDS = 86400;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ZERO_CHAR_CODE = 48;
const DASH_CHAR_CODE = 45;
/** Bounds the toFormat cache, since valid locale tags are unlimited, e.g. when they come from a request. */
const MAX_CACHED_FORMATTERS = 100;
/** Longer tokens come first so that e.g. `yyyy` is not matched as four `y`. */
const FORMAT_TOKEN_PATTERN = /yyyy|yy|y|MM|M|dd|d/g;

/** Days in a 400-year cycle of the proleptic Gregorian calendar. */
const DAYS_PER_ERA = 146097;

/** Days from 0000-03-01 to 1970-01-01, the epoch the day count is relative to. */
const EPOCH_SHIFT_DAYS = 719468;

export enum DayOfTheWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

function assertIntegerAmount(amount: number): void {
  if (!Number.isInteger(amount)) {
    throw new Error(
      `CalendarDate Validation Error: Input amount ${amount} is not valid. Amount must be an integer.`,
    );
  }
}

/** Returns the ASCII digit at the index as a number, or NaN for any other character. */
function digitAt(isoString: string, index: number): number {
  const digit = isoString.charCodeAt(index) - ZERO_CHAR_CODE;
  return digit >= 0 && digit <= 9 ? digit : NaN;
}

/** Reads the fixed YYYY-MM-DD positions directly instead of matching a regex and slicing substrings. */
function parseIsoString(isoString: string): { year: number; month: number; day: number } {
  if (
    isoString.length === 10 &&
    isoString.charCodeAt(4) === DASH_CHAR_CODE &&
    isoString.charCodeAt(7) === DASH_CHAR_CODE
  ) {
    const year =
      digitAt(isoString, 0) * 1000 +
      digitAt(isoString, 1) * 100 +
      digitAt(isoString, 2) * 10 +
      digitAt(isoString, 3);
    const month = digitAt(isoString, 5) * 10 + digitAt(isoString, 6);
    const day = digitAt(isoString, 8) * 10 + digitAt(isoString, 9);
    if (!Number.isNaN(year + month + day)) {
      return { year, month, day };
    }
  }
  throw new Error(
    `CalendarDate Validation Error: Input ${isoString.toString()} is not valid, it should follow the pattern YYYY-MM-DD.`,
  );
}

/**
 * Days since 1970-01-01 in the proleptic Gregorian calendar, the same calendar `Date` uses.
 * Counts years from March so the leap day ends the year. Algorithm: Howard Hinnant, `days_from_civil`.
 */
function daysFromCivil(year: number, month: number, day: number): number {
  const marchBasedYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(marchBasedYear / 400);
  const yearOfEra = marchBasedYear - era * 400;
  const marchBasedMonth = month > 2 ? month - 3 : month + 9;
  const dayOfYear = Math.floor((153 * marchBasedMonth + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;

  return era * DAYS_PER_ERA + dayOfEra - EPOCH_SHIFT_DAYS;
}

/** Inverse of {@link daysFromCivil}. Algorithm: Howard Hinnant, `civil_from_days`. */
function civilFromDays(days: number): { year: number; month: number; day: number } {
  const shiftedDays = days + EPOCH_SHIFT_DAYS;
  const era = Math.floor(shiftedDays / DAYS_PER_ERA);
  const dayOfEra = shiftedDays - era * DAYS_PER_ERA;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / (DAYS_PER_ERA - 1))) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const marchBasedMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const month = marchBasedMonth < 10 ? marchBasedMonth + 3 : marchBasedMonth - 9;

  return {
    year: yearOfEra + era * 400 + (month <= 2 ? 1 : 0),
    month,
    day: dayOfYear - Math.floor((153 * marchBasedMonth + 2) / 5) + 1,
  };
}

export class CalendarDate {
  readonly year: number;

  /**
   * Month of the year starting from 1
   */
  readonly month: number;

  /**
   * Day of the month starting from 1
   */
  readonly day: number;

  /**
   * Seconds passed since the unix epoch. Always calculated with a time and timezone set to T00:00:00.00Z.
   */
  readonly unixTimestampInSeconds: number;

  /**
   * Day of the week starting from monday according to ISO 8601. Values from 1-7.
   */
  readonly weekday: number;

  /**
   * cache for Intl.DateTimeFormat instances
   * @private
   */
  private static dateTimeFormatterByTimezone = new Map<string, Intl.DateTimeFormat>();

  /**
   * cache for Intl.DateTimeFormat instances used by toFormat
   * @private
   */
  private static dateTimeFormatterByLocaleAndOptions = new Map<string, Intl.DateTimeFormat>();

  /**
   * The minimum representable CalendarDate: 0001-01-01.
   * Intended as a sentinel value instead of null, e.g. to model a date range with an open start.
   */
  static readonly MIN_VALUE = new CalendarDate(1, 1, 1);

  /**
   * The maximum representable CalendarDate: 9999-12-31.
   * Intended as a sentinel value instead of null, e.g. to model a date range with an open end.
   */
  static readonly MAX_VALUE = new CalendarDate(9999, 12, 31);

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
   * @param year Integer between 1-9999
   * @param month Integer between 1-12
   * @param day Integer between 1-31
   */
  constructor(year: number, month: number, day: number);

  constructor(input1: string | number, input2?: number, input3?: number) {
    if (typeof input1 === 'string') {
      const result = parseIsoString(input1);
      this.year = result.year;
      this.month = result.month;
      this.day = result.day;
    } else if (
      typeof input1 === 'number' &&
      typeof input2 === 'number' &&
      typeof input3 === 'number'
    ) {
      this.year = input1;
      this.month = input2;
      this.day = input3;
    } else {
      const inputs = [input1, input2, input3].filter((input) => input !== undefined);
      throw new Error(
        `CalendarDate Validation Error: Input [ ${inputs.join(
          ' , ',
        )} ] of type [ ${inputs.map((input) => typeof input).join(' , ')} ] is not valid.`,
      );
    }

    if (
      !Number.isInteger(this.year) ||
      !Number.isInteger(this.month) ||
      !Number.isInteger(this.day)
    ) {
      throw new Error(
        `CalendarDate Validation Error: Input date ${this.year}-${this.month}-${this.day} is not valid. Year, month and day must be integers.`,
      );
    }
    if (this.year < 1 || this.year > 9999) {
      throw new Error(
        `CalendarDate Validation Error: Input year ${this.year} is not valid. Year must be a number between 1 and 9999.`,
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

    const daysSinceEpoch = daysFromCivil(this.year, this.month, this.day);
    this.unixTimestampInSeconds = daysSinceEpoch * DAY_IN_SECONDS;
    // 1970-01-01 was a Thursday (4).
    this.weekday = ((((daysSinceEpoch + 3) % 7) + 7) % 7) + 1;
    Object.freeze(this);
  }

  public static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  public static getMaxDayOfMonth(year: number, month: number): number {
    return month === 2 && CalendarDate.isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  }

  /**
   * Creates a Date in local time. Sets the year explicitly because the Date constructor
   * maps years 0-99 to 1900-1999.
   */
  private static createDateLocal(year: number, month: number, day: number): Date {
    const date = new Date(year, month - 1, day);
    date.setFullYear(year);
    return date;
  }

  private static getIntlDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
    let formatter = CalendarDate.dateTimeFormatterByTimezone.get(timeZone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
      });
      CalendarDate.dateTimeFormatterByTimezone.set(timeZone, formatter);
    }
    return formatter;
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
    return new CalendarDate(
      CalendarDate.getIntlDateTimeFormatter(timeZone).format(date).padStart(10, '0'),
    );
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
    const { year, month, day } = parseIsoString(isoString);
    return new CalendarDate(year, month, day);
  }

  static max(...values: CalendarDate[]): CalendarDate {
    if (!values.length) {
      throw new Error(
        'CalendarDate.max Validation Error: Function max requires at least one input argument.',
      );
    }
    return values.reduce(
      (maxValue, currentValue) =>
        currentValue.valueOf() > maxValue.valueOf() ? currentValue : maxValue,
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
      (minValue, currentValue) =>
        currentValue.valueOf() < minValue.valueOf() ? currentValue : minValue,
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
      // Creating a formatter is far more expensive than formatting with it. Formatting UTC midnight
      // in UTC keeps the cached formatter independent of the process time zone.
      const key = `${input}|${JSON.stringify(options)}`;
      let formatter = CalendarDate.dateTimeFormatterByLocaleAndOptions.get(key);
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(input, { ...options, timeZone: 'UTC' });
        if (CalendarDate.dateTimeFormatterByLocaleAndOptions.size >= MAX_CACHED_FORMATTERS) {
          // Maps iterate in insertion order, so the first key is the oldest entry.
          const oldestKey = CalendarDate.dateTimeFormatterByLocaleAndOptions.keys().next().value;
          if (oldestKey !== undefined) {
            CalendarDate.dateTimeFormatterByLocaleAndOptions.delete(oldestKey);
          }
        }
        CalendarDate.dateTimeFormatterByLocaleAndOptions.set(key, formatter);
      }
      return formatter.format(this.toDateUTC());
    } else {
      return input.replace(FORMAT_TOKEN_PATTERN, (token) => {
        switch (token) {
          case 'yyyy':
            return this.year.toString().padStart(4, '0');
          case 'yy':
            return this.year.toString().slice(-2).padStart(2, '0');
          case 'y':
            return this.year.toString();
          case 'MM':
            return this.month.toString().padStart(2, '0');
          case 'M':
            return this.month.toString();
          case 'dd':
            return this.day.toString().padStart(2, '0');
          default:
            return this.day.toString();
        }
      });
    }
  }

  /**
   * Used by JSON stringify method.
   */
  toJSON(): string {
    return this.toString();
  }

  toDateUTC(): Date {
    return new Date(this.unixTimestampInSeconds * 1000);
  }

  toDateLocal(): Date {
    return CalendarDate.createDateLocal(this.year, this.month, this.day);
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
   * Checks if the month and year of this CalendarDate are the same as the month and year of the supplied CalendarDate.
   */
  isSameMonth(calendarDate: CalendarDate): boolean {
    return this.year === calendarDate.year && this.month === calendarDate.month;
  }

  /**
   * Checks if the year of this CalendarDate is the same as the year of the supplied CalendarDate.
   */
  isSameYear(calendarDate: CalendarDate): boolean {
    return this.year === calendarDate.year;
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
   * Throws an Error if the amount is not an integer.
   *
   * @param amount
   * @param enforceEndOfMonth If set to true the addition will never cause an overflow to the next month.
   */
  addMonths(amount: number, enforceEndOfMonth = false): CalendarDate {
    assertIntegerAmount(amount);
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
   * Returns a new CalendarDate with the specified amount of years added.
   * Throws an Error if the amount is not an integer.
   *
   * @param amount
   * @param enforceEndOfMonth If set to true the addition will never cause an overflow to the next month.
   */
  addYears(amount: number, enforceEndOfMonth = false): CalendarDate {
    assertIntegerAmount(amount);
    return this.addMonths(amount * 12, enforceEndOfMonth);
  }

  /**
   * Returns a new CalendarDate with the specified amount of days added.
   * Allows overflow. Throws an Error if the amount is not an integer.
   */
  addDays(amount: number): CalendarDate {
    assertIntegerAmount(amount);
    const dayInSameMonth = this.day + amount;
    // Every month has at least 28 days, so the year and month can't change.
    if (dayInSameMonth >= 1 && dayInSameMonth <= 28) {
      return new CalendarDate(this.year, this.month, dayInSameMonth);
    }
    const { year, month, day } = civilFromDays(this.valueOf() / DAY_IN_SECONDS + amount);
    return new CalendarDate(year, month, day);
  }

  /**
   * Returns a new CalendarDate with the specified amount of weeks added.
   * Throws an Error if the amount is not an integer.
   */
  addWeeks(amount: number): CalendarDate {
    assertIntegerAmount(amount);
    return this.addDays(amount * 7);
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
   * returns the first day (january 1) of the year of this calendar date as a new calendar date object.
   */
  getFirstDayOfYear(): CalendarDate {
    return new CalendarDate(this.year, 1, 1);
  }

  /**
   * returns the last day (december 31) of the year of this calendar date as a new calendar date object.
   */
  getLastDayOfYear(): CalendarDate {
    return new CalendarDate(this.year, 12, 31);
  }

  /**
   * returns the first day of the quarter of this calendar date as a new calendar date object.
   */
  getFirstDayOfQuarter(): CalendarDate {
    return new CalendarDate(this.year, (this.quarter - 1) * 3 + 1, 1);
  }

  /**
   * returns the last day of the quarter of this calendar date as a new calendar date object.
   */
  getLastDayOfQuarter(): CalendarDate {
    const lastMonthOfQuarter = this.quarter * 3;
    return new CalendarDate(
      this.year,
      lastMonthOfQuarter,
      CalendarDate.getMaxDayOfMonth(this.year, lastMonthOfQuarter),
    );
  }

  /**
   * returns true if the calendar date is january 1
   */
  isFirstDayOfYear(): boolean {
    return this.month === 1 && this.day === 1;
  }

  /**
   * returns true if the calendar date is december 31
   */
  isLastDayOfYear(): boolean {
    return this.month === 12 && this.day === 31;
  }

  /**
   * returns true if the calendar date is the first day of the quarter (january 1, april 1, july 1 or october 1)
   */
  isFirstDayOfQuarter(): boolean {
    return this.month % 3 === 1 && this.day === 1;
  }

  /**
   * returns true if the calendar date is the last day of the quarter (march 31, june 30, september 30 or december 31)
   */
  isLastDayOfQuarter(): boolean {
    return this.month % 3 === 0 && this.isLastDayOfMonth();
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
    const thursday = this.getThursdayOfWeek();
    const firstDayOfWeekYear = daysFromCivil(civilFromDays(thursday).year, 1, 1);
    return Math.floor((thursday - firstDayOfWeekYear) / 7) + 1;
  }

  /**
   * The ISO 8601 week-numbering year the date belongs to. Around the turn of the year this can
   * differ from the calendar year: e.g. 2023-01-01 is in week 52 of the week-numbering year 2022
   * and 2025-12-29 is in week 1 of the week-numbering year 2026.
   */
  public get weekYear(): number {
    return civilFromDays(this.getThursdayOfWeek()).year;
  }

  /**
   * Returns the Thursday of the week of this date as days since the unix epoch.
   * The year of this Thursday decides the ISO 8601 week-numbering year.
   */
  private getThursdayOfWeek(): number {
    return this.valueOf() / DAY_IN_SECONDS + 4 - this.weekday;
  }

  /**
   * The quarter of the year (1-4) based on the month of the date.
   *
   * Quarter breakdown:
   * - 1st Quarter: January to March (1-3)
   * - 2nd Quarter: April to June (4-6)
   * - 3rd Quarter: July to September (7-9)
   * - 4th Quarter: October to December (10-12)
   */
  public get quarter(): number {
    return Math.floor((this.month - 1) / 3) + 1;
  }
}
