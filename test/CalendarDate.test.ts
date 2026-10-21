import * as fc from 'fast-check';
import fs from 'fs';
import { CalendarDate, DayOfTheWeek } from 'calendar-date';
import { expectTypeOf } from 'vitest';
import { calendarDateArbitrary, DAY_IN_SECONDS, ensureValidDay } from './helpers';

const YEAR_ERROR_MESSAGE = (year: number) =>
  `CalendarDate Validation Error: Input year ${year} is not valid. Year must be a number between 1 and 9999.`;

describe('CalendarDate', () => {
  describe('Test of constructor', () => {
    describe('Input type: year/month/day', () => {
      test('Throws error if second or third inputs are missing', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 200, max: 9800 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 31 }),
            (year, month, day) => {
              // Arrange
              const undefinedAsNumber: number = undefined as unknown as number;

              // Assert
              expect(() => new CalendarDate(year, undefinedAsNumber, undefinedAsNumber)).toThrow(
                `CalendarDate Validation Error: Input [ ${year} ] of type [ number ] is not valid.`,
              );
              expect(() => new CalendarDate(year, month, undefinedAsNumber)).toThrow(
                `CalendarDate Validation Error: Input [ ${year} , ${month} ] of type [ number , number ] is not valid.`,
              );
              expect(() => new CalendarDate(year, undefinedAsNumber, day)).toThrow(
                `CalendarDate Validation Error: Input [ ${year} , ${day} ] of type [ number , number ] is not valid.`,
              );
            },
          ),
        );
      });

      test('Throws error if year is below 1 or above 9999', () => {
        fc.assert(
          fc.property(
            fc.integer({ max: 0 }),
            fc.integer({ min: 10000 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 31 }),
            (yearLowerInterval, yearUpperInterval, month, day) => {
              // Assert
              expect(() => new CalendarDate(yearLowerInterval, month, day)).toThrow(
                `CalendarDate Validation Error: Input year ${yearLowerInterval} is not valid. Year must be a number between 1 and 9999.`,
              );
              expect(() => new CalendarDate(yearUpperInterval, month, day)).toThrow(
                `CalendarDate Validation Error: Input year ${yearUpperInterval} is not valid. Year must be a number between 1 and 9999.`,
              );
            },
          ),
        );
      });

      test('Throws error if month is below 1 or above 12', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ max: 0 }),
            fc.integer({ min: 13 }),
            fc.integer({ min: 1, max: 31 }),
            (year, monthLowerInterval, monthUpperInterval, day) => {
              // Assert
              expect(() => new CalendarDate(year, monthLowerInterval, day)).toThrow(
                `CalendarDate Validation Error: Input month ${monthLowerInterval} is not valid. Month must be a number between 1 and 12.`,
              );
              expect(() => new CalendarDate(year, monthUpperInterval, day)).toThrow(
                `CalendarDate Validation Error: Input month ${monthUpperInterval} is not valid. Month must be a number between 1 and 12.`,
              );
            },
          ),
        );
      });

      test('Throws error if day is below 1', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ max: 0 }),
            (year, month, day) => {
              // Assert
              expect(() => new CalendarDate(year, month, day)).toThrow(
                `CalendarDate Validation Error: Input day ${day} is not valid. Day must be a number greater than 0.`,
              );
            },
          ),
        );
      });

      test.each([
        [2023.5, 1, 1],
        [2023, 2.5, 1],
        [2023, 1, 1.5],
        [NaN, 1, 1],
        [2023, NaN, 1],
        [2023, 1, NaN],
        [Infinity, 1, 1],
      ])('Throws error if an input is not an integer: %s-%s-%s', (year, month, day) => {
        expect(() => new CalendarDate(year, month, day)).toThrow(
          `CalendarDate Validation Error: Input date ${year}-${month}-${day} is not valid. Year, month and day must be integers.`,
        );
      });

      test('Throws error if day is not a valid day of month', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 29 }),
            (year, month, day) => {
              // Arrange
              const maxDayOfMonth = ensureValidDay(year, month, 31);
              day = Math.max(maxDayOfMonth + 1, day);

              // Assert
              expect(() => new CalendarDate(year, month, day)).toThrow(
                `CalendarDate Validation Error: Input date ${year}-${month}-${day} is not a valid calendar date.`,
              );
            },
          ),
        );
      });

      test.each([
        [1900, 2, 29],
        [2100, 2, 29],
        [2023, 2, 29],
      ])('Throws error for February 29 in the common year %s', (year, month, day) => {
        expect(() => new CalendarDate(year, month, day)).toThrow(
          `CalendarDate Validation Error: Input date ${year}-${month}-${day} is not a valid calendar date.`,
        );
      });

      test.each([
        [2000, '2000-02-29'],
        [2024, '2024-02-29'],
        [4, '0004-02-29'],
      ])('Constructs February 29 in the leap year %s', (year, expected) => {
        expect(new CalendarDate(year, 2, 29).toString()).toBe(expected);
      });

      test('Construct CalendarDate from year, month and day', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 31 }),
            (year, month, day) => {
              // Arrange
              day = ensureValidDay(year, month, day);

              // Act
              const calendarDate = new CalendarDate(year, month, day);

              // Assert
              expect(calendarDate.year).toBe(year);
              expect(calendarDate.month).toBe(month);
              expect(calendarDate.day).toBe(day);
            },
          ),
        );
      });

      test('Matches the UTC timestamp and weekday of Date for the whole year range', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 31 }),
            (year, month, day) => {
              // Arrange
              day = ensureValidDay(year, month, day);
              const date = new Date(Date.UTC(2000, month - 1, day));
              date.setUTCFullYear(year);

              // Act
              const calendarDate = new CalendarDate(year, month, day);

              // Assert
              expect(calendarDate.unixTimestampInSeconds).toBe(date.getTime() / 1000);
              expect(calendarDate.weekday).toBe(date.getUTCDay() === 0 ? 7 : date.getUTCDay());
            },
          ),
        );
      });

      test('Save correct weekday for date', () => {
        expect(new CalendarDate(`2023-01-01`).weekday).toBe(7);
        expect(new CalendarDate(`2023-01-02`).weekday).toBe(1);
        expect(new CalendarDate(`2023-01-03`).weekday).toBe(2);
        expect(new CalendarDate(`2023-01-04`).weekday).toBe(3);
        expect(new CalendarDate(`2023-01-05`).weekday).toBe(4);
        expect(new CalendarDate(`2023-01-06`).weekday).toBe(5);
        expect(new CalendarDate(`2023-01-07`).weekday).toBe(6);
        expect(new CalendarDate(`2023-01-08`).weekday).toBe(7);
      });

      test('Types the weekday as DayOfTheWeek', () => {
        const weekday = new CalendarDate(2023, 1, 1).weekday;

        // Assert
        expectTypeOf(weekday).toEqualTypeOf<DayOfTheWeek>();
        expect(weekday).toBe(DayOfTheWeek.SUNDAY);
      });
    });

    describe('Input type: string', () => {
      test('Throws error if format is wrong', () => {
        const input = '01-01-2023';
        expect(() => new CalendarDate(input)).toThrow(
          `CalendarDate Validation Error: Input ${input} is not valid, it should follow the pattern YYYY-MM-DD.`,
        );
      });

      test('Throws error if one of the numbers does not pass validation', () => {
        expect(() => new CalendarDate('2023-18-05')).toThrow(
          `CalendarDate Validation Error: Input month 18 is not valid. Month must be a number between 1 and 12.`,
        );
      });

      test('Construct CalendarDate from IsoString', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 9999 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1, max: 31 }),
            (year, month, day) => {
              // Arrange
              day = ensureValidDay(year, month, day);
              const isoString = `${year.toString().padStart(4, '0')}-${month
                .toString()
                .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

              // Act
              const calendarDate = new CalendarDate(isoString);

              // Assert
              expect(calendarDate.year).toBe(year);
              expect(calendarDate.month).toBe(month);
              expect(calendarDate.day).toBe(day);
            },
          ),
        );
      });
    });
  });

  describe('Test of nowUTC, nowLocal and nowTimeZone', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test.each(['2020-06-01T00:30:00.000Z', '2020-06-01T23:30:00.000Z'])(
      'nowUTC returns the UTC date at %s',
      (isoDateTime) => {
        // Arrange
        vi.setSystemTime(new Date(isoDateTime));

        // Act
        const calendarDate = CalendarDate.nowUTC();

        // Assert
        expect(calendarDate.toString()).toBe('2020-06-01');
      },
    );

    test.each([0, 12, 23])('nowLocal returns the local date at %s:30 local time', (hours) => {
      // Arrange
      vi.setSystemTime(new Date(2020, 5, 1, hours, 30));

      // Act
      const calendarDate = CalendarDate.nowLocal();

      // Assert
      expect(calendarDate.toString()).toBe('2020-06-01');
    });

    test.each([
      ['Asia/Tokyo', '2020-06-02'],
      ['America/New_York', '2020-06-01'],
      ['UTC', '2020-06-01'],
    ])('nowTimeZone returns the date in %s', (timeZone, expected) => {
      // Arrange
      vi.setSystemTime(new Date('2020-06-01T23:30:00.000Z'));

      // Act
      const calendarDate = CalendarDate.nowTimeZone(timeZone);

      // Assert
      expect(calendarDate.toString()).toBe(expected);
    });
  });

  describe('Test of fromDateUTC and fromDateLocal', () => {
    test.each([0, 12, 23])('fromDateLocal returns the local date at %s:30 local time', (hours) => {
      // Arrange
      const date = new Date(2020, 5, 1, hours, 30);

      // Act
      const calendarDate = CalendarDate.fromDateLocal(date);

      // Assert
      expect(calendarDate.toString()).toBe('2020-06-01');
    });

    test.each([0, 12, 23])('fromDateUTC returns the UTC date at %s:30 UTC', (hours) => {
      // Arrange
      const date = new Date(Date.UTC(2020, 5, 1, hours, 30));

      // Act
      const calendarDate = CalendarDate.fromDateUTC(date);

      // Assert
      expect(calendarDate.toString()).toBe('2020-06-01');
    });

    test('fromDateLocal returns the local date for years below 100', () => {
      // Arrange
      // The Date constructor maps the years 0-99 to 1900-1999, setFullYear does not.
      const date = new Date(2020, 5, 1, 23, 30);
      date.setFullYear(50);

      // Act
      const calendarDate = CalendarDate.fromDateLocal(date);

      // Assert
      expect(calendarDate.toString()).toBe('0050-06-01');
    });

    test('fromDateUTC returns the UTC date for years below 100', () => {
      // Arrange
      // Date.UTC maps the years 0-99 to 1900-1999, setUTCFullYear does not.
      const date = new Date(Date.UTC(2020, 5, 1, 23, 30));
      date.setUTCFullYear(50);

      // Act
      const calendarDate = CalendarDate.fromDateUTC(date);

      // Assert
      expect(calendarDate.toString()).toBe('0050-06-01');
    });

    test('Throws for an invalid Date', () => {
      // Arrange
      const invalidDate = new Date(NaN);

      // Assert
      expect(() => CalendarDate.fromDateUTC(invalidDate)).toThrow(
        'CalendarDate Validation Error: Input date NaN-NaN-NaN is not valid. Year, month and day must be integers.',
      );
      expect(() => CalendarDate.fromDateLocal(invalidDate)).toThrow(
        'CalendarDate Validation Error: Input date NaN-NaN-NaN is not valid. Year, month and day must be integers.',
      );
    });
  });

  describe('Test of fromDateWithTimeZone', () => {
    test('Keeps the formatter cache bounded for many spellings of time zones', () => {
      const date = new Date('2020-06-01T12:00:00.000Z');
      const cache = (
        CalendarDate as unknown as {
          dateTimeFormatterByTimezone: Map<string, Intl.DateTimeFormat>;
        }
      ).dateTimeFormatterByTimezone;
      const letters = [...'europe/berlin'];

      // Act
      for (let mask = 0; mask < 250; mask++) {
        // Each bit of the mask capitalizes one letter, Intl accepts every spelling.
        const timeZone = letters
          .map((letter, i) => ((mask >> i) & 1 ? letter.toUpperCase() : letter))
          .join('');
        expect(CalendarDate.fromDateWithTimeZone(date, timeZone).toString()).toBe('2020-06-01');
      }

      // Assert
      expect(CalendarDate.fromDateWithTimeZone(date, 'Asia/Tokyo').toString()).toBe('2020-06-01');
      expect(cache.size).toBe(100);
    });

    test.each([
      ['America/New_York', '2020-05-31'],
      ['Asia/Tokyo', '2020-06-01'],
      ['UTC', '2020-06-01'],
    ])('Returns the date of the instant in the time zone %s', (timeZone, expected) => {
      // Arrange
      const date = new Date('2020-06-01T02:00:00.000Z');

      // Act
      const calendarDate = CalendarDate.fromDateWithTimeZone(date, timeZone);

      // Assert
      expect(calendarDate.toString()).toBe(expected);
    });

    test('should return correct date for a year < 1000', () => {
      // Arrange
      // Date.UTC maps the years 0-99 to 1900-1999, setUTCFullYear does not.
      const date = new Date(Date.UTC(2000, 0, 1, 12));
      date.setUTCFullYear(50);

      // Act
      const calendarDate = CalendarDate.fromDateWithTimeZone(date, 'America/New_York');

      // Assert
      expect(calendarDate.toString()).toBe('0050-01-01');
    });
  });

  describe('Test of parse', () => {
    test('Should throw error if input is not a valid iso string', () => {
      fc.assert(
        fc.property(fc.string(), (string) => {
          expect(() => CalendarDate.parse(string)).toThrow(
            `CalendarDate Validation Error: Input ${string.toString()} is not valid, it should follow the pattern YYYY-MM-DD.`,
          );
        }),
      );
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 2 }),
          fc.string({ minLength: 1, maxLength: 2 }),
          fc.string({ minLength: 1, maxLength: 2 }),
          (year, month, day) => {
            // Arrange
            const isoString = `${year}-${month}-${day}`;

            // Assert
            expect(() => CalendarDate.parse(isoString)).toThrow(
              `CalendarDate Validation Error: Input ${isoString.toString()} is not valid, it should follow the pattern YYYY-MM-DD.`,
            );
          },
        ),
      );
    });

    test('Accepts and rejects the same strings as the YYYY-MM-DD pattern', () => {
      const parseWithPattern = (isoString: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
          throw new Error(
            `CalendarDate Validation Error: Input ${isoString} is not valid, it should follow the pattern YYYY-MM-DD.`,
          );
        }
        return new CalendarDate(
          Number(isoString.slice(0, 4)),
          Number(isoString.slice(5, 7)),
          Number(isoString.slice(8, 10)),
        );
      };
      const outcome = (parse: () => CalendarDate) => {
        try {
          return parse().toString();
        } catch (error) {
          return (error as Error).message;
        }
      };
      const isoLikeString = fc
        .array(fc.constantFrom(...'0123456789-/ a٣０'), { minLength: 8, maxLength: 12 })
        .map((chars) => chars.join(''));
      const almostValidString = fc
        .tuple(
          fc.integer({ min: 0, max: 9999 }),
          fc.integer({ min: 0, max: 13 }),
          fc.integer({ min: 0, max: 32 }),
          fc.integer({ min: 0, max: 9 }),
          fc.constantFrom('', ' ', '0', 'x', '٣'),
        )
        .map(([year, month, day, position, replacement]) => {
          const isoString = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return replacement === '' || position % 3 === 0
            ? isoString
            : isoString.slice(0, position) + replacement + isoString.slice(position + 1);
        });

      fc.assert(
        fc.property(fc.oneof(isoLikeString, almostValidString), (isoString) => {
          expect(outcome(() => CalendarDate.parse(isoString))).toBe(
            outcome(() => parseWithPattern(isoString)),
          );
        }),
        { numRuns: 10000 },
      );
    });
  });

  describe('Test of toString', () => {
    test('The returned string is in ISO format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const expected = `${year.toString().padStart(4, '0')}-${month
              .toString()
              .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            // Act
            const isoString = new CalendarDate(year, month, day).toString();

            // Assert
            expect(isoString).toBe(expected);
          },
        ),
      );
    });

    test('Round trips through the constructor and parse', () => {
      fc.assert(
        fc.property(calendarDateArbitrary(), (date) => {
          // Act
          const isoString = date.toString();

          // Assert
          expect(new CalendarDate(isoString).equals(date)).toBe(true);
          expect(CalendarDate.parse(isoString).equals(date)).toBe(true);
        }),
      );
    });
  });

  describe('Test of toFormat', () => {
    test('Should replace all supported tokens correctly for pattern variant', () => {
      // Assert
      expect(new CalendarDate('2020-01-05').toFormat('dd:MM:yyyy')).toBe('05:01:2020');
      expect(new CalendarDate('2020-01-05').toFormat('yyyy-MM-dd')).toBe('2020-01-05');
      expect(new CalendarDate('1920-01-05').toFormat('MM::dd::yy')).toBe('01::05::20');
      expect(new CalendarDate('2020-01-05').toFormat('d_M_y')).toBe('5_1_2020');
      expect(new CalendarDate('2020-11-20').toFormat('d.M.y')).toBe('20.11.2020');
      expect(new CalendarDate('2020-01-05').toFormat('dd:MM:yyyy , dd-MM-yyyy')).toBe(
        '05:01:2020 , 05-01-2020',
      );
    });

    test.each([
      ["dd 'de' MM", '05 de 01'],
      ["'day' d 'of' yyyy", 'day 5 of 2020'],
      ["dd.MM.''yy", "05.01.'20"],
      ["'o''clock' d", "o'clock 5"],
      ["''''", "''"],
      ["'''d'", "'d"],
      ["'yyyy-MM-dd'yyyy", 'yyyy-MM-dd2020'],
    ])('Keeps quoted text in pattern %s', (pattern, expected) => {
      expect(new CalendarDate('2020-01-05').toFormat(pattern)).toBe(expected);
    });

    test('Keeps any quoted text', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (text) => {
          // Quoted text of only quotes is ambiguous: "''''" reads as two escaped quotes.
          fc.pre(text.replace(/'/g, '') !== '');
          // Arrange
          const pattern = `'${text.replace(/'/g, "''")}'`;

          // Assert
          expect(new CalendarDate('2020-01-05').toFormat(pattern)).toBe(text);
        }),
        { numRuns: 10000 },
      );
    });

    test.each(["'dd", "dd'", "'de' 'MM", "d'''"])(
      'Throws for quoted text without a closing quote in pattern %s',
      (pattern) => {
        expect(() => new CalendarDate('2020-01-05').toFormat(pattern)).toThrow(
          `CalendarDate Validation Error: Pattern ${pattern} is not valid. Quoted text must end with a single quote.`,
        );
      },
    );

    test('Matches replacing each token one after another in patterns without quotes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc
            .array(fc.constantFrom(...'yMd.-/ x$&'), { maxLength: 12 })
            .map((chars) => chars.join('')),
          (year, month, day, pattern) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const expected = pattern
              .replace(/yyyy/g, year.toString().padStart(4, '0'))
              .replace(/yy/g, year.toString().slice(-2).padStart(2, '0'))
              .replace(/y/g, year.toString())
              .replace(/MM/g, month.toString().padStart(2, '0'))
              .replace(/M/g, month.toString())
              .replace(/dd/g, day.toString().padStart(2, '0'))
              .replace(/d/g, day.toString());

            // Assert
            expect(new CalendarDate(year, month, day).toFormat(pattern)).toBe(expected);
          },
        ),
        { numRuns: 10000 },
      );
    });

    test('Should print correct date for the Intl Api version', () => {
      // Assert
      expect(
        new CalendarDate('2020-01-05').toFormat('en', { month: 'long', year: '2-digit' }),
      ).toBe('January 20');
      expect(
        new CalendarDate('2020-01-05').toFormat('en', {
          month: '2-digit',
          year: 'numeric',
          day: '2-digit',
        }),
      ).toBe('01/05/2020');
      expect(
        new CalendarDate('2020-01-05').toFormat('de', {
          month: '2-digit',
          year: 'numeric',
          day: '2-digit',
        }),
      ).toBe('05.01.2020');
      expect(
        new CalendarDate('2020-01-05').toFormat('en', {
          month: 'short',
          day: '2-digit',
          weekday: 'long',
        }),
      ).toBe('Sunday, Jan 05');
    });

    test('Should print correct date for the Intl Api version for years below 100', () => {
      // Assert
      expect(
        new CalendarDate(50, 1, 1).toFormat('en', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }),
      ).toBe('1/1/50');
      expect(
        new CalendarDate(50, 1, 1).toFormat('en', {
          year: 'numeric',
          month: 'long',
          weekday: 'long',
          day: 'numeric',
        }),
      ).toBe('Saturday, January 1, 50');
    });

    test('Keeps the calendar date if the process time zone changes after the first call', () => {
      const originalTimeZone = process.env.TZ;
      const date = new CalendarDate(2020, 6, 1);
      const options = { year: 'numeric', month: 'numeric', day: 'numeric' } as const;
      try {
        // Act
        process.env.TZ = 'America/New_York';
        const formattedInNewYork = date.toFormat('de-DE', options);
        process.env.TZ = 'Asia/Tokyo';
        const formattedInTokyo = date.toFormat('de-DE', options);

        // Assert
        expect(formattedInNewYork).toBe('1.6.2020');
        expect(formattedInTokyo).toBe('1.6.2020');
      } finally {
        // Assigning undefined would set the string "undefined", which Node treats as UTC.
        if (originalTimeZone === undefined) {
          delete process.env.TZ;
        } else {
          process.env.TZ = originalTimeZone;
        }
      }
    });

    test('Keeps the formatter cache bounded for many distinct locales', () => {
      const date = new CalendarDate(2020, 6, 1);
      const cache = (
        CalendarDate as unknown as {
          dateTimeFormatterByLocaleAndOptions: Map<string, Intl.DateTimeFormat>;
        }
      ).dateTimeFormatterByLocaleAndOptions;

      // Act
      for (let i = 0; i < 250; i++) {
        expect(date.toFormat(`en-x-${i.toString().padStart(3, '0')}`, { month: 'long' })).toBe(
          'June',
        );
      }

      // Assert
      expect(date.toFormat('de', { month: 'long' })).toBe('Juni');
      expect(cache.size).toBe(100);
    });

    test('Keeps the newest formatters when the cache is full', () => {
      const date = new CalendarDate(2020, 6, 1);
      const options = { month: 'long' } as const;
      for (let i = 0; i < 150; i++) {
        date.toFormat(`en-x-${i.toString().padStart(3, '0')}`, options);
      }
      const constructorSpy = vi.spyOn(Intl, 'DateTimeFormat');

      try {
        // Act
        // Locales 50 to 149 are the newest 100, clearing the whole cache at 100 would drop 60.
        date.toFormat('en-x-060', options);

        // Assert
        expect(constructorSpy).not.toHaveBeenCalled();
      } finally {
        constructorSpy.mockRestore();
      }
    });

    test('Reuses formatters without mixing up locales or options', () => {
      const date = new CalendarDate('2020-01-05');

      // Assert
      expect(date.toFormat('en', { month: 'long' })).toBe('January');
      expect(date.toFormat('en', { month: 'short' })).toBe('Jan');
      expect(date.toFormat('de', { month: 'long' })).toBe('Januar');
      expect(date.toFormat('en', { month: 'long', day: 'numeric' })).toBe('January 5');
      expect(date.toFormat('en', { day: 'numeric', month: 'long' })).toBe('January 5');
      expect(new CalendarDate('2021-03-07').toFormat('en', { month: 'long' })).toBe('March');
    });
  });

  describe('Test of toJSON', () => {
    test('Is serialized as the ISO string', () => {
      // Assert
      expect(JSON.stringify({ d: new CalendarDate(2020, 1, 5) })).toBe('{"d":"2020-01-05"}');
      expect(JSON.stringify([new CalendarDate(50, 12, 31)])).toBe('["0050-12-31"]');
    });

    test('Round trips through JSON.stringify and parse', () => {
      fc.assert(
        fc.property(calendarDateArbitrary(), (date) => {
          // Act
          const parsed = CalendarDate.parse(JSON.parse(JSON.stringify(date)));

          // Assert
          expect(parsed.equals(date)).toBe(true);
        }),
      );
    });
  });

  describe('Test of toDateUTC', () => {
    test('The returned date object represents the start of the day of the calendarDate in UTC timezone', () => {
      fc.assert(
        fc.property(calendarDateArbitrary(), (calendarDate) => {
          // Act
          const date = calendarDate.toDateUTC();

          // Assert
          expect(date.toISOString()).toEqual(`${calendarDate.toString()}T00:00:00.000Z`);
        }),
      );
    });

    test('Round trips with fromDateUTC', () => {
      fc.assert(
        fc.property(calendarDateArbitrary(), (calendarDate) => {
          // Act
          const roundTripped = CalendarDate.fromDateUTC(calendarDate.toDateUTC());

          // Assert
          expect(roundTripped.equals(calendarDate)).toBe(true);
        }),
      );
    });
  });

  describe('Test of toDateLocal', () => {
    // Includes the days on which daylight saving time starts and ends in New York and Berlin, and a
    // year below 100, which the Date constructor maps to 1900-1999.
    test.each(['2020-03-08', '2020-11-01', '2020-03-29', '2020-10-25', '2020-07-15', '0050-01-01'])(
      'Returns the start of the day %s in the local time zone',
      (isoString) => {
        // Arrange
        const calendarDate = new CalendarDate(isoString);

        // Act
        const date = calendarDate.toDateLocal();

        // Assert
        expect(date.getFullYear()).toBe(calendarDate.year);
        expect(date.getMonth()).toBe(calendarDate.month - 1);
        expect(date.getDate()).toBe(calendarDate.day);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
      },
    );

    test('Round trips with fromDateLocal for the whole year range', () => {
      // Not asserting midnight here: in some time zones, e.g. Asia/Tokyo in 1948-1951, daylight
      // saving time started at midnight, so the first local time of those days is 01:00.
      fc.assert(
        fc.property(calendarDateArbitrary(), (calendarDate) => {
          // Act
          const roundTripped = CalendarDate.fromDateLocal(calendarDate.toDateLocal());

          // Assert
          expect(roundTripped.equals(calendarDate)).toBe(true);
        }),
        { numRuns: 1000 },
      );
    });
  });

  describe('Test of equals', () => {
    test('Returns true if the input object has the same unix timestamp', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const date1 = new CalendarDate(year, month, day);
            const date2 = new CalendarDate(year, month, day);

            // Assert
            expect(date1.equals(date2)).toBe(true);
          },
        ),
      );
    });

    test('Returns false if the input object has not the same unix timestamp', () => {
      fc.assert(
        fc.property(
          calendarDateArbitrary({ minYear: 4, maxYear: 9996 }),
          fc.integer({ min: -1000, max: 1000 }).filter((offset) => offset !== 0),
          (date1, offset) => {
            // Arrange
            const date2 = date1.addDays(offset);

            // Assert
            expect(date1.equals(date2)).toBe(false);
            expect(date2.equals(date1)).toBe(false);
          },
        ),
      );
    });
  });

  describe('Test of isSameMonth', () => {
    test('Returns true if the input object has the same month and year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day1, day2) => {
            // Arrange
            day1 = ensureValidDay(year, month, day1);
            day2 = ensureValidDay(year, month, day2);
            const date1 = new CalendarDate(year, month, day1);
            const date2 = new CalendarDate(year, month, day2);

            // Assert
            expect(date1.isSameMonth(date2)).toBe(true);
          },
        ),
      );
    });

    test('Returns false if the input object has a different month or year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          (year1, year2, month1, month2) => {
            fc.pre(year1 !== year2 || month1 !== month2);

            // Arrange
            const day1 = ensureValidDay(year1, month1, 1);
            const day2 = ensureValidDay(year2, month2, 1);
            const date1 = new CalendarDate(year1, month1, day1);
            const date2 = new CalendarDate(year2, month2, day2);

            // Assert
            expect(date1.isSameMonth(date2)).toBe(false);
          },
        ),
      );
    });
  });

  describe('Test of isSameYear', () => {
    test('Returns true if the input object has the same year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month1, month2, day1, day2) => {
            // Arrange
            day1 = ensureValidDay(year, month1, day1);
            day2 = ensureValidDay(year, month2, day2);
            const date1 = new CalendarDate(year, month1, day1);
            const date2 = new CalendarDate(year, month2, day2);

            // Assert
            expect(date1.isSameYear(date2)).toBe(true);
          },
        ),
      );
    });

    test('Returns false if the input object has a different year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          (year1, year2) => {
            fc.pre(year1 !== year2); // Ensure different years

            // Arrange
            const date1 = new CalendarDate(year1, 1, 1);
            const date2 = new CalendarDate(year2, 1, 1);

            // Assert
            expect(date1.isSameYear(date2)).toBe(false);
          },
        ),
      );
    });
  });

  describe('Test of isBefore, isAfter, isBeforeOrEqual and isAfterOrEqual', () => {
    test.each<
      ['isBefore' | 'isAfter' | 'isBeforeOrEqual' | 'isAfterOrEqual', boolean, boolean, boolean]
    >([
      ['isBefore', true, false, false],
      ['isAfter', false, false, true],
      ['isBeforeOrEqual', true, true, false],
      ['isAfterOrEqual', false, true, true],
    ])(
      '%s returns %s for a later date, %s for an equal date and %s for an earlier date',
      (method, laterResult, equalResult, earlierResult) => {
        fc.assert(
          fc.property(
            calendarDateArbitrary({ minYear: 4, maxYear: 9996 }),
            fc.integer({ min: 1, max: 1000 }),
            (date, days) => {
              // Arrange
              const laterDate = date.addDays(days);
              const equalDate = new CalendarDate(date.year, date.month, date.day);
              const earlierDate = date.addDays(-days);

              // Assert
              expect(date[method](laterDate)).toBe(laterResult);
              expect(date[method](equalDate)).toBe(equalResult);
              expect(date[method](earlierDate)).toBe(earlierResult);
            },
          ),
        );
      },
    );
  });

  describe('Test of max', () => {
    test('Throws Error for no input arguments', () => {
      expect(() => CalendarDate.max()).toThrow(
        'CalendarDate.max Validation Error: Function max requires at least one input argument.',
      );
    });

    test('Returns input value for 1 input argument', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9800 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            expect(CalendarDate.max(calendarDate)).toBe(calendarDate);
          },
        ),
      );
    });

    test('Returns the calendarDate from the inputs with the highest unixTimestamp', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 200, max: 9800 }), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer({ min: 1, max: 12 }), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer({ min: 1, max: 31 }), { maxLength: 10, minLength: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (years, months, days, amount) => {
            // Arrange
            const calendarDates = Array.from(Array(amount).keys()).map(
              (idx) =>
                new CalendarDate(
                  years[idx],
                  months[idx],
                  ensureValidDay(years[idx], months[idx], days[idx]),
                ),
            );
            const maxCalendarDate = new CalendarDate(
              9801,
              months[0],
              ensureValidDay(9801, months[0], days[0]),
            );

            // Assert
            expect(CalendarDate.max(...calendarDates, maxCalendarDate)).toBe(maxCalendarDate);
            expect(CalendarDate.max(maxCalendarDate, ...calendarDates)).toBe(maxCalendarDate);
          },
        ),
      );
    });
  });

  describe('Test of min', () => {
    test('Throws Error for no input arguments', () => {
      expect(() => CalendarDate.min()).toThrow(
        'CalendarDate.min Validation Error: Function min requires at least one input argument.',
      );
    });

    test('Returns input value for 1 input argument', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9800 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            expect(CalendarDate.min(calendarDate)).toBe(calendarDate);
          },
        ),
      );
    });

    test('Returns the calendarDate from the inputs with the lowest unixTimestamp', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 200, max: 9800 }), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer({ min: 1, max: 12 }), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer({ min: 1, max: 31 }), { maxLength: 10, minLength: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (years, months, days, amount) => {
            // Arrange
            const calendarDates = Array.from(Array(amount).keys()).map(
              (idx) =>
                new CalendarDate(
                  years[idx],
                  months[idx],
                  ensureValidDay(years[idx], months[idx], days[idx]),
                ),
            );
            const minCalendarDate = new CalendarDate(
              199,
              months[0],
              ensureValidDay(199, months[0], days[0]),
            );

            // Assert
            expect(CalendarDate.min(...calendarDates, minCalendarDate)).toBe(minCalendarDate);
            expect(CalendarDate.min(minCalendarDate, ...calendarDates)).toBe(minCalendarDate);
          },
        ),
      );
    });
  });

  describe('Test of MIN_VALUE and MAX_VALUE', () => {
    test('MIN_VALUE is 0001-01-01 and MAX_VALUE is 9999-12-31', () => {
      expect(CalendarDate.MIN_VALUE.toString()).toBe('0001-01-01');
      expect(CalendarDate.MAX_VALUE.toString()).toBe('9999-12-31');
    });

    test('Adding months or years beyond the representable range throws', () => {
      expect(() => CalendarDate.MAX_VALUE.addMonths(1)).toThrow(YEAR_ERROR_MESSAGE(10000));
      expect(() => CalendarDate.MAX_VALUE.addYears(1)).toThrow(YEAR_ERROR_MESSAGE(10000));
      expect(() => CalendarDate.MIN_VALUE.addMonths(-1)).toThrow(YEAR_ERROR_MESSAGE(0));
      expect(() => CalendarDate.MIN_VALUE.addYears(-1)).toThrow(YEAR_ERROR_MESSAGE(0));
    });

    test('Adding months up to the edges of the representable range works', () => {
      expect(CalendarDate.MAX_VALUE.addMonths(0).toString()).toBe('9999-12-31');
      expect(new CalendarDate(9999, 10, 31).addMonths(2).toString()).toBe('9999-12-31');
      expect(new CalendarDate(9999, 10, 31).addMonths(2, false).toString()).toBe('9999-12-31');
      expect(new CalendarDate(1, 3, 31).addMonths(-2).toString()).toBe('0001-01-31');
    });
  });

  describe.each([
    ['sortAscending', (a: CalendarDate, b: CalendarDate) => a.valueOf() <= b.valueOf()],
    ['sortDescending', (a: CalendarDate, b: CalendarDate) => a.valueOf() >= b.valueOf()],
  ] as const)('Test of %s', (method, isInOrder) => {
    test('Returns a sorted copy of the input array and does not modify the input array', () => {
      fc.assert(
        fc.property(fc.array(calendarDateArbitrary(), { maxLength: 30 }), (calendarDates) => {
          // Arrange
          const inputCopy = [...calendarDates];

          // Act
          const sortedCalendarDates = CalendarDate[method](calendarDates);

          // Assert
          expect(sortedCalendarDates).not.toBe(calendarDates);
          for (let idx = 1; idx < sortedCalendarDates.length; idx++) {
            expect(isInOrder(sortedCalendarDates[idx - 1], sortedCalendarDates[idx])).toBe(true);
          }
          expect(sortedCalendarDates.map(String).sort()).toEqual(calendarDates.map(String).sort());
          expect(calendarDates).toHaveLength(inputCopy.length);
          calendarDates.forEach((date, idx) => expect(date).toBe(inputCopy[idx]));
        }),
      );
    });
  });

  describe('Test of getFirstDayOfMonth', () => {
    test('Returns new instance with same year and month but day set to 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const firstDayDate = baseDate.getFirstDayOfMonth();

            // Assert
            expect(firstDayDate.year).toBe(baseDate.year);
            expect(firstDayDate.month).toBe(baseDate.month);
            expect(firstDayDate.day).toBe(1);
          },
        ),
      );
    });

    test('Returns new instance even if date is already the same month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          (year, month) => {
            // Arrange
            const baseDate = new CalendarDate(year, month, 1);

            // Act
            const firstDayDate = baseDate.getFirstDayOfMonth();

            // Assert
            expect(firstDayDate).not.toBe(baseDate);
            expect(firstDayDate.equals(baseDate)).toBe(true);
          },
        ),
      );
    });
  });

  describe('Test of getLastDayOfMonth', () => {
    test('Returns new instance with same year and month but day set to the last day of the month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const lastDayDate = baseDate.getLastDayOfMonth();
            const nextDay = lastDayDate.addDays(1);

            // Assert
            expect(lastDayDate.year).toBe(baseDate.year);
            expect(lastDayDate.month).toBe(baseDate.month);
            expect(nextDay.day).toBe(1);
          },
        ),
      );
    });
  });

  describe('Test of isFirstDayOfMonth', () => {
    test('Returns true if the day is 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          (year, month) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, 1);

            // Act
            const firstOfMonth = calendarDate.isFirstDayOfMonth();

            // Assert
            expect(firstOfMonth).toEqual(true);
          },
        ),
      );
    });

    test('Returns false if the day is not equal to 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Act
            const firstOfMonth = calendarDate.isFirstDayOfMonth();

            // Assert
            expect(firstOfMonth).toEqual(false);
          },
        ),
      );
    });
  });

  describe('Test of isLastDayOfMonth', () => {
    test('Returns true if the day is the last day of the month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          (year, month) => {
            // Arrange
            const calendarDate = new CalendarDate(
              year,
              month,
              CalendarDate.getMaxDayOfMonth(year, month),
            );

            // Act
            const lastDayOfMonth = calendarDate.isLastDayOfMonth();

            // Assert
            expect(lastDayOfMonth).toEqual(true);
          },
        ),
      );
    });

    test('Returns false if the day is not the last day of the month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 30 }),
          (year, month, day) => {
            // Arrange
            let calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));
            if (calendarDate.day === CalendarDate.getMaxDayOfMonth(year, month)) {
              calendarDate = calendarDate.addDays(-1);
            }

            // Act
            const lastDayOfMonth = calendarDate.isLastDayOfMonth();

            // Assert
            expect(lastDayOfMonth).toEqual(false);
          },
        ),
      );
    });
  });

  describe('Test of getFirstDayOfYear', () => {
    test('Returns new instance with same year but month and day set to 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const firstDayDate = baseDate.getFirstDayOfYear();

            // Assert
            expect(firstDayDate).not.toBe(baseDate);
            expect(firstDayDate.year).toBe(baseDate.year);
            expect(firstDayDate.month).toBe(1);
            expect(firstDayDate.day).toBe(1);
          },
        ),
      );
    });
  });

  describe('Test of getLastDayOfYear', () => {
    test('Returns new instance with same year but date set to december 31', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const lastDayDate = baseDate.getLastDayOfYear();

            // Assert
            expect(lastDayDate.year).toBe(baseDate.year);
            expect(lastDayDate.month).toBe(12);
            expect(lastDayDate.day).toBe(31);
          },
        ),
      );
    });
  });

  describe('Test of getFirstDayOfQuarter', () => {
    test('Returns new instance with the first day of the quarter of the base date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const firstDayDate = baseDate.getFirstDayOfQuarter();

            // Assert
            expect(firstDayDate.year).toBe(baseDate.year);
            expect(firstDayDate.quarter).toBe(baseDate.quarter);
            expect(firstDayDate.day).toBe(1);
            expect([1, 4, 7, 10]).toContain(firstDayDate.month);
            expect(firstDayDate.isBeforeOrEqual(baseDate)).toBe(true);
          },
        ),
      );
    });

    test('Correct first day of quarter for each quarter', () => {
      expect(new CalendarDate('2023-02-15').getFirstDayOfQuarter().toString()).toBe('2023-01-01');
      expect(new CalendarDate('2023-05-15').getFirstDayOfQuarter().toString()).toBe('2023-04-01');
      expect(new CalendarDate('2023-08-15').getFirstDayOfQuarter().toString()).toBe('2023-07-01');
      expect(new CalendarDate('2023-11-15').getFirstDayOfQuarter().toString()).toBe('2023-10-01');
    });
  });

  describe('Test of getLastDayOfQuarter', () => {
    test('Returns new instance with the last day of the quarter of the base date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const lastDayDate = baseDate.getLastDayOfQuarter();

            // Assert
            expect(lastDayDate.year).toBe(baseDate.year);
            expect(lastDayDate.quarter).toBe(baseDate.quarter);
            expect(lastDayDate.isLastDayOfMonth()).toBe(true);
            expect([3, 6, 9, 12]).toContain(lastDayDate.month);
            expect(lastDayDate.isAfterOrEqual(baseDate)).toBe(true);
          },
        ),
      );
    });

    test('Correct last day of quarter for each quarter', () => {
      expect(new CalendarDate('2023-02-15').getLastDayOfQuarter().toString()).toBe('2023-03-31');
      expect(new CalendarDate('2023-05-15').getLastDayOfQuarter().toString()).toBe('2023-06-30');
      expect(new CalendarDate('2023-08-15').getLastDayOfQuarter().toString()).toBe('2023-09-30');
      expect(new CalendarDate('2023-11-15').getLastDayOfQuarter().toString()).toBe('2023-12-31');
    });
  });

  describe('Test of isFirstDayOfYear', () => {
    test('Returns true only for january 1', () => {
      expect(new CalendarDate('2023-01-01').isFirstDayOfYear()).toBe(true);
      expect(new CalendarDate('2023-01-02').isFirstDayOfYear()).toBe(false);
      expect(new CalendarDate('2023-02-01').isFirstDayOfYear()).toBe(false);
      expect(new CalendarDate('2023-12-31').isFirstDayOfYear()).toBe(false);
    });

    test('Is consistent with getFirstDayOfYear', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            expect(calendarDate.isFirstDayOfYear()).toBe(
              calendarDate.equals(calendarDate.getFirstDayOfYear()),
            );
          },
        ),
      );
    });
  });

  describe('Test of isLastDayOfYear', () => {
    test('Returns true only for december 31', () => {
      expect(new CalendarDate('2023-12-31').isLastDayOfYear()).toBe(true);
      expect(new CalendarDate('2023-12-30').isLastDayOfYear()).toBe(false);
      expect(new CalendarDate('2023-01-31').isLastDayOfYear()).toBe(false);
      expect(new CalendarDate('2023-01-01').isLastDayOfYear()).toBe(false);
    });

    test('Is consistent with getLastDayOfYear', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            expect(calendarDate.isLastDayOfYear()).toBe(
              calendarDate.equals(calendarDate.getLastDayOfYear()),
            );
          },
        ),
      );
    });
  });

  describe('Test of isFirstDayOfQuarter', () => {
    test('Returns true only for the first day of a quarter', () => {
      expect(new CalendarDate('2023-01-01').isFirstDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-04-01').isFirstDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-07-01').isFirstDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-10-01').isFirstDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-02-01').isFirstDayOfQuarter()).toBe(false);
      expect(new CalendarDate('2023-04-02').isFirstDayOfQuarter()).toBe(false);
    });

    test('Is consistent with getFirstDayOfQuarter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            expect(calendarDate.isFirstDayOfQuarter()).toBe(
              calendarDate.equals(calendarDate.getFirstDayOfQuarter()),
            );
          },
        ),
      );
    });
  });

  describe('Test of isLastDayOfQuarter', () => {
    test('Returns true only for the last day of a quarter', () => {
      expect(new CalendarDate('2023-03-31').isLastDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-06-30').isLastDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-09-30').isLastDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-12-31').isLastDayOfQuarter()).toBe(true);
      expect(new CalendarDate('2023-03-30').isLastDayOfQuarter()).toBe(false);
      expect(new CalendarDate('2020-02-29').isLastDayOfQuarter()).toBe(false);
      expect(new CalendarDate('2023-01-31').isLastDayOfQuarter()).toBe(false);
    });

    test('Is consistent with getLastDayOfQuarter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            expect(calendarDate.isLastDayOfQuarter()).toBe(
              calendarDate.equals(calendarDate.getLastDayOfQuarter()),
            );
          },
        ),
      );
    });
  });

  describe('Test of getFirstDayOfWeek', () => {
    test('Returns new instance with the day of the week of 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const firstDayOfWeekDate = baseDate.getFirstDayOfWeek();

            // Assert
            expect(firstDayOfWeekDate.weekday).toBe(1);
            expect(firstDayOfWeekDate.unixTimestampInSeconds).toBe(
              baseDate.unixTimestampInSeconds - (baseDate.weekday - 1) * DAY_IN_SECONDS,
            );
          },
        ),
      );
    });
  });

  describe('Test of getLastDayOfWeek', () => {
    test('Returns new instance with the day of the week of 7', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const lastDayOfWeek = baseDate.getLastDayOfWeek();

            // Assert
            expect(lastDayOfWeek.weekday).toBe(7);
            expect(lastDayOfWeek.unixTimestampInSeconds).toBe(
              baseDate.unixTimestampInSeconds + (7 - baseDate.weekday) * DAY_IN_SECONDS,
            );
          },
        ),
      );
    });
  });

  describe('Test of isFirstDayOfWeek', () => {
    test('Returns true if the weekday is 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            let calendarDate = new CalendarDate(year, month, day);
            if (calendarDate.weekday !== 1) {
              calendarDate = calendarDate.addDays(-(calendarDate.weekday - 1));
            }

            // Assert
            expect(calendarDate.isFirstDayOfWeek()).toEqual(true);
          },
        ),
      );
    });

    test('Returns false if the weekday is not equal to 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            let calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));
            if (calendarDate.weekday === 1) {
              calendarDate = calendarDate.addDays(+1);
            }

            // Assert
            expect(calendarDate.isFirstDayOfWeek()).toEqual(false);
          },
        ),
      );
    });
  });

  describe('Test of isLastDayOfWeek', () => {
    test('Returns true if the weekday is 7', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            let calendarDate = new CalendarDate(year, month, day);
            if (calendarDate.weekday !== 7) {
              calendarDate = calendarDate.addDays(7 - calendarDate.weekday);
            }

            // Assert
            expect(calendarDate.isLastDayOfWeek()).toEqual(true);
          },
        ),
      );
    });

    test('Returns false if the weekday is not equal to 7', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            let calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));
            if (calendarDate.weekday === 7) {
              calendarDate = calendarDate.addDays(-1);
            }

            // Assert
            expect(calendarDate.isLastDayOfWeek()).toEqual(false);
          },
        ),
      );
    });
  });

  describe('Test of addMonths', () => {
    test('The day is always the same for the new date and the base date if the base day is 28 or lower', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 9989 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: -100, max: 100 }),
          (year, month, day, monthsAdded) => {
            // Arrange
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const newDate = baseDate.addMonths(monthsAdded);

            // Assert
            expect(newDate).not.toBe(baseDate);
            expect(newDate.day).toBe(baseDate.day);
            const differenceMonths = newDate.month - baseDate.month;
            const differenceYears = newDate.year - baseDate.year;
            expect(monthsAdded).toBe(differenceMonths + 12 * differenceYears);
          },
        ),
      );
    });

    test('If the base day is greater than the max day of the new month the difference should overflow into the next month if enforceEndOfMonth is set to false', () => {
      // Arrange
      const baseDate = new CalendarDate(2021, 1, 31);

      // Act
      const newDate = baseDate.addMonths(1, false);

      // Assert
      expect(newDate.month).toBe(3);
      expect(newDate.day).toBe(3);
      expect(newDate.year).toBe(2021);
    });

    test('Matches Date.setUTCMonth if enforceEndOfMonth is set to false', () => {
      fc.assert(
        fc.property(
          // With at most 100 years added or subtracted, the results stay within 1-9999.
          calendarDateArbitrary({ minYear: 101, maxYear: 9898 }),
          fc.integer({ min: -1200, max: 1200 }),
          (baseDate, monthsAdded) => {
            // Arrange
            const date = new Date(0);
            date.setUTCFullYear(baseDate.year, baseDate.month - 1, baseDate.day);
            date.setUTCMonth(date.getUTCMonth() + monthsAdded);

            // Act
            const newDate = baseDate.addMonths(monthsAdded, false);

            // Assert
            expect(newDate.year).toBe(date.getUTCFullYear());
            expect(newDate.month).toBe(date.getUTCMonth() + 1);
            expect(newDate.day).toBe(date.getUTCDate());
          },
        ),
        { numRuns: 10000 },
      );
    });

    test('The day should not overflow into the next month by default', () => {
      // Arrange
      const baseDate = new CalendarDate(2021, 1, 31);

      // Act
      const newDate = baseDate.addMonths(1);

      // Assert
      expect(newDate.toString()).toBe('2021-02-28');
      expect(newDate.equals(baseDate.addMonths(1, true))).toBe(true);
    });

    test.each([
      ['2020-01-31', 1, '2020-02-29'],
      ['2020-03-31', -1, '2020-02-29'],
      ['2020-03-31', 1, '2020-04-30'],
      ['2020-12-31', 2, '2021-02-28'],
      ['2021-03-31', -13, '2020-02-29'],
      ['2020-05-31', 0, '2020-05-31'],
    ])('Adding months to %s with amount %i returns %s by default', (base, amount, expected) => {
      expect(new CalendarDate(base).addMonths(amount).toString()).toBe(expected);
    });

    test('By default the new date is in the target month on the same day or the last day of that month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 9899 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -1000, max: 1000 }),
          (year, month, day, monthsAdded) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const newDate = baseDate.addMonths(monthsAdded);

            // Assert
            const differenceMonths = newDate.month - baseDate.month;
            const differenceYears = newDate.year - baseDate.year;
            expect(differenceMonths + 12 * differenceYears).toBe(monthsAdded);
            expect(newDate.day).toBe(
              Math.min(day, CalendarDate.getMaxDayOfMonth(newDate.year, newDate.month)),
            );
          },
        ),
      );
    });
  });

  describe('Test of addYears', () => {
    test('Behaves the same as adding the equivalent amount of months', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9800 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -100, max: 100 }),
          fc.boolean(),
          (year, month, day, yearsAdded, enforceEndOfMonth) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const newDate = baseDate.addYears(yearsAdded, enforceEndOfMonth);

            // Assert
            expect(newDate).not.toBe(baseDate);
            expect(newDate.equals(baseDate.addMonths(yearsAdded * 12, enforceEndOfMonth))).toBe(
              true,
            );
          },
        ),
      );
    });

    test('The day overflows into the next month if the new date is not in a leap year and enforceEndOfMonth is set to false', () => {
      // Arrange
      const baseDate = new CalendarDate(2020, 2, 29);

      // Act
      const newDate = baseDate.addYears(1, false);

      // Assert
      expect(newDate.toString()).toBe('2021-03-01');
    });

    test('The day should not overflow into the next month by default', () => {
      // Arrange
      const baseDate = new CalendarDate(2020, 2, 29);

      // Act
      const newDate = baseDate.addYears(1);

      // Assert
      expect(newDate.toString()).toBe('2021-02-28');
      expect(newDate.equals(baseDate.addYears(1, true))).toBe(true);
    });

    test('Works with negative amounts', () => {
      // Arrange
      const baseDate = new CalendarDate(2020, 6, 15);

      // Act
      const newDate = baseDate.addYears(-5);

      // Assert
      expect(newDate.toString()).toBe('2015-06-15');
    });
  });

  describe('Test of addDays', () => {
    test('Returns a new valid instance with the number of days added', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9995 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -1000, max: 1000 }),
          (year, month, day, daysAdded) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const newDate = baseDate.addDays(daysAdded);

            // Assert
            expect(newDate).not.toBe(baseDate);
            expect(newDate.valueOf()).toBe(baseDate.valueOf() + DAY_IN_SECONDS * daysAdded);
          },
        ),
      );
    });

    test('Throws if the result leaves the representable range', () => {
      expect(() => CalendarDate.MAX_VALUE.addDays(1)).toThrow(
        'CalendarDate Validation Error: Input year 10000 is not valid. Year must be a number between 1 and 9999.',
      );
      expect(() => CalendarDate.MIN_VALUE.addDays(-1)).toThrow(
        'CalendarDate Validation Error: Input year 0 is not valid. Year must be a number between 1 and 9999.',
      );
    });

    test('Matches Date for small amounts within and across month boundaries', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -40, max: 40 }),
          (year, month, day, daysAdded) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const date = new Date(Date.UTC(2000, month - 1, day));
            date.setUTCFullYear(year);
            date.setUTCDate(date.getUTCDate() + daysAdded);
            fc.pre(date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999);

            // Act
            const newDate = new CalendarDate(year, month, day).addDays(daysAdded);

            // Assert
            expect(newDate.valueOf()).toBe(date.getTime() / 1000);
            expect(newDate.weekday).toBe(date.getUTCDay() === 0 ? 7 : date.getUTCDay());
          },
        ),
        { numRuns: 10000 },
      );
    });

    test('Matches Date for dates before 1970', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 1969 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -365, max: 365 }),
          (year, month, day, daysAdded) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const date = new Date(Date.UTC(2000, month - 1, day));
            date.setUTCFullYear(year);
            date.setUTCDate(date.getUTCDate() + daysAdded);

            // Act
            const newDate = new CalendarDate(year, month, day).addDays(daysAdded);

            // Assert
            expect(newDate.valueOf()).toBe(date.getTime() / 1000);
          },
        ),
      );
    });
  });

  describe('Test of non-integer amounts', () => {
    const baseDate = new CalendarDate(1969, 12, 31);

    test.each([0.5, -1e-9, 0.999999999999, NaN, Infinity, -Infinity])(
      'Throws for amount %s',
      (amount) => {
        const message = `CalendarDate Validation Error: Input amount ${amount} is not valid. Amount must be an integer.`;
        expect(() => baseDate.addDays(amount)).toThrow(message);
        expect(() => baseDate.addWeeks(amount)).toThrow(message);
        expect(() => baseDate.addMonths(amount)).toThrow(message);
        expect(() => baseDate.addYears(amount)).toThrow(message);
      },
    );
  });

  describe('Test of addWeeks', () => {
    test('Adds seven days per week and keeps the weekday', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -1000, max: 1000 }),
          (year, month, day, weeksAdded) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const newDate = baseDate.addWeeks(weeksAdded);

            // Assert
            expect(newDate).not.toBe(baseDate);
            expect(newDate.valueOf()).toBe(baseDate.valueOf() + DAY_IN_SECONDS * 7 * weeksAdded);
            expect(newDate.weekday).toBe(baseDate.weekday);
          },
        ),
      );
    });

    test('Returns the correct date', () => {
      expect(new CalendarDate('2020-01-01').addWeeks(2).toString()).toBe('2020-01-15');
      expect(new CalendarDate('2020-01-15').addWeeks(-2).toString()).toBe('2020-01-01');
    });
  });

  describe('Test of getDifferenceInDays', () => {
    test('Result is zero if the input date is the same as the base date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.boolean(),
          (year, month, day, absolute) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);

            // Act
            const difference = baseDate.getDifferenceInDays(baseDate, absolute);

            // Assert
            expect(difference).toBe(0);
          },
        ),
      );
    });

    test('Result is positive if the input date is in the past', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 1000 }),
          (year, month, day, offset) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);
            const inputDate = baseDate.addDays(-offset);

            // Act
            const difference = baseDate.getDifferenceInDays(inputDate);

            // Assert
            expect(difference).toBeGreaterThan(0);
          },
        ),
      );
    });

    test('Result is negative if the input date is in the future', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 1000 }),
          (year, month, day, offset) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);
            const inputDate = baseDate.addDays(offset);

            // Act
            const difference = baseDate.getDifferenceInDays(inputDate);

            // Assert
            expect(difference).toBeLessThan(0);
          },
        ),
      );
    });

    test('Result is the amount of days added, or its absolute value if absolute is true', () => {
      fc.assert(
        fc.property(
          calendarDateArbitrary({ minYear: 1000, maxYear: 9000 }),
          fc.integer({ min: -300000, max: 300000 }),
          (date, days) => {
            // Arrange
            const otherDate = date.addDays(days);

            // Act
            const difference = otherDate.getDifferenceInDays(date);
            const absoluteDifference = date.getDifferenceInDays(otherDate, true);

            // Assert
            expect(difference).toBe(days);
            expect(absoluteDifference).toBe(Math.abs(days));
          },
        ),
      );
    });

    test('Result is never negative if absolute parameter is true', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          (year1, year2, month1, month2, day1, day2) => {
            // Arrange
            day1 = ensureValidDay(year1, month1, day1);
            day2 = ensureValidDay(year2, month2, day2);
            const baseDate = new CalendarDate(year1, month1, day1);
            const inputDate = new CalendarDate(year2, month2, day2);

            // Act
            const difference = baseDate.getDifferenceInDays(inputDate, true);

            // Assert
            expect(difference).toBeGreaterThanOrEqual(0);
          },
        ),
      );
    });
  });

  describe('Test of isLeapYear', () => {
    test.each([
      [1900, false],
      [2000, true],
      [2100, false],
      [4, true],
      [100, false],
      [400, true],
      [2023, false],
      [2024, true],
    ])('Returns the correct result for the year %s', (year, expected) => {
      expect(CalendarDate.isLeapYear(year)).toBe(expected);
    });
  });

  describe('Test of getMaxDayOfMonth', () => {
    test.each([
      [1900, 28],
      [2000, 29],
      [2100, 28],
    ])('Returns the correct number of days for february of the year %s', (year, expected) => {
      expect(CalendarDate.getMaxDayOfMonth(year, 2)).toBe(expected);
    });

    test('Returns 30 for input months of 4-6-9-11', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 0, max: 3 }),
          (year, monthIndex) => {
            // Arrange
            const month = [4, 6, 9, 11][monthIndex];

            // Act
            const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, month);

            // Assert
            expect(maxDayOfMonth).toBe(30);
          },
        ),
      );
    });

    test('Returns 31 for input months of 1-3-5-7-8-10-12', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 0, max: 6 }),
          (year, monthIndex) => {
            // Arrange
            const month = [1, 3, 5, 7, 8, 10, 12][monthIndex];

            // Act
            const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, month);

            // Assert
            expect(maxDayOfMonth).toBe(31);
          },
        ),
      );
    });

    test('Returns 29 for a leap year and february', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 2000 }), (yearInput) => {
          // Arrange
          let year = yearInput * 4;
          if (year % 400 !== 0 && year % 100 === 0) {
            year += 4;
          }

          // Act
          const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, 2);

          // Assert
          expect(maxDayOfMonth).toBe(29);
        }),
      );
    });

    test('Returns 28 for a non leap year and february', () => {
      fc.assert(
        fc.property(fc.integer({ min: 200, max: 9800 }), (year) => {
          // Arrange
          if (year % 4 === 0) {
            year += 1;
          }

          // Act
          const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, 2);

          // Assert
          expect(maxDayOfMonth).toBe(28);
        }),
      );
    });
  });

  describe('Test of custom string description', () => {
    test('the default string description of CalendarDate should be CalendarDate', () => {
      const dateInstance = new CalendarDate('2021-01-01');
      const tag = Object.prototype.toString.call(dateInstance);
      expect(tag).toBe('[object CalendarDate]');
    });
  });

  describe('Test of week', () => {
    test('week number of CalendarDate should be the same as expected for time range 1970-01-01 - 2100-12-31', () => {
      const start = new CalendarDate('1970-01-01');
      const end = new CalendarDate('2101-01-01');
      const json = fs.readFileSync('./test/expectedIsoWeek_1970_01_01-2100_12_31.json', {
        encoding: 'utf8',
      });
      const expectedWeekNumbers: Record<string, number> = JSON.parse(json);
      for (let date = start; date.isBefore(end); date = date.addDays(1)) {
        expect(expectedWeekNumbers[date.toString()]).toBe(date.week);
      }
    });

    test('Week number is correct for years below 100', () => {
      // Expected values according to ISO 8601, verified with pythons datetime.isocalendar
      expect(new CalendarDate(1, 1, 1).week).toBe(1);
      expect(new CalendarDate(3, 6, 15).week).toBe(24);
      expect(new CalendarDate(3, 12, 31).week).toBe(1);
      expect(new CalendarDate(50, 1, 1).week).toBe(52);
      expect(new CalendarDate(99, 12, 31).week).toBe(53);
    });

    test('Week and week-numbering year match a UTC Date calculation for the whole year range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const thursday = new Date(Date.UTC(2000, month - 1, day));
            thursday.setUTCFullYear(year);
            thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7));
            const firstOfJanuary = new Date(Date.UTC(2000, 0, 1));
            firstOfJanuary.setUTCFullYear(thursday.getUTCFullYear());
            const expectedWeek =
              Math.floor(
                (thursday.getTime() - firstOfJanuary.getTime()) / (DAY_IN_SECONDS * 7000),
              ) + 1;

            // Act
            const calendarDate = new CalendarDate(year, month, day);

            // Assert
            expect(calendarDate.week).toBe(expectedWeek);
            expect(calendarDate.weekYear).toBe(thursday.getUTCFullYear());
          },
        ),
        { numRuns: 10000 },
      );
    });

    test('Week number is correct at the edges of the representable range', () => {
      // Expected values according to ISO 8601, verified with pythons datetime.isocalendar
      expect(CalendarDate.MIN_VALUE.week).toBe(1);
      expect(CalendarDate.MIN_VALUE.weekYear).toBe(1);
      expect(CalendarDate.MAX_VALUE.week).toBe(52);
      expect(CalendarDate.MAX_VALUE.weekYear).toBe(9999);
    });
  });

  describe('Test of weekYear', () => {
    test('Week-numbering year is correct around the turn of the year', () => {
      // Expected values according to ISO 8601, verified with pythons datetime.isocalendar
      expect(new CalendarDate('2023-01-01').weekYear).toBe(2022);
      expect(new CalendarDate('2023-01-02').weekYear).toBe(2023);
      expect(new CalendarDate('2021-01-01').weekYear).toBe(2020);
      expect(new CalendarDate('2020-12-31').weekYear).toBe(2020);
      expect(new CalendarDate('2025-12-29').weekYear).toBe(2026);
      expect(new CalendarDate('2020-06-15').weekYear).toBe(2020);
    });

    test('January dates in week 53 belong to the previous week-numbering year', () => {
      // Expected values according to ISO 8601, verified with pythons datetime.isocalendar
      const firstOfJanuary2027 = new CalendarDate('2027-01-01');
      expect(firstOfJanuary2027.week).toBe(53);
      expect(firstOfJanuary2027.weekYear).toBe(2026);
      const firstOfJanuary2021 = new CalendarDate('2021-01-01');
      expect(firstOfJanuary2021.week).toBe(53);
      expect(firstOfJanuary2021.weekYear).toBe(2020);
    });

    test('Week-numbering year is correct for years below 100', () => {
      // Expected values according to ISO 8601, verified with pythons datetime.isocalendar
      expect(new CalendarDate(3, 12, 31).weekYear).toBe(4);
      expect(new CalendarDate(5, 1, 1).weekYear).toBe(4);
      expect(new CalendarDate(99, 12, 31).weekYear).toBe(99);
    });

    test('Is always consistent with the week and year properties', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Assert
            if (calendarDate.month === 1 && calendarDate.week > 50) {
              expect(calendarDate.weekYear).toBe(calendarDate.year - 1);
            } else if (calendarDate.month === 12 && calendarDate.week === 1) {
              expect(calendarDate.weekYear).toBe(calendarDate.year + 1);
            } else {
              expect(calendarDate.weekYear).toBe(calendarDate.year);
            }
          },
        ),
      );
    });
  });

  describe('Test of quarter', () => {
    test('Result is always between 1 and 4', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          (year, month, day) => {
            // Arrange
            const calendarDate = new CalendarDate(year, month, ensureValidDay(year, month, day));

            // Act
            const quarter = calendarDate.quarter;

            // Assert
            expect(quarter).toBeLessThan(5);
            expect(quarter).toBeGreaterThan(0);
          },
        ),
      );
    });
    test('Correct quarter for each month', () => {
      expect(new CalendarDate(2023, 1, 1).quarter).toBe(1);
      expect(new CalendarDate(2023, 2, 1).quarter).toBe(1);
      expect(new CalendarDate(2023, 3, 1).quarter).toBe(1);
      expect(new CalendarDate(2023, 4, 1).quarter).toBe(2);
      expect(new CalendarDate(2023, 5, 1).quarter).toBe(2);
      expect(new CalendarDate(2023, 6, 1).quarter).toBe(2);
      expect(new CalendarDate(2023, 7, 1).quarter).toBe(3);
      expect(new CalendarDate(2023, 8, 1).quarter).toBe(3);
      expect(new CalendarDate(2023, 9, 1).quarter).toBe(3);
      expect(new CalendarDate(2023, 10, 1).quarter).toBe(4);
      expect(new CalendarDate(2023, 11, 1).quarter).toBe(4);
      expect(new CalendarDate(2023, 12, 1).quarter).toBe(4);
    });
  });
});
