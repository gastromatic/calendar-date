import * as fc from 'fast-check';
import { CalendarDate, CalendarDateRange } from 'calendar-date';
import {
  calendarDateArbitrary,
  calendarDateRangeArbitrary,
  DAY_IN_SECONDS,
  ensureValidDay,
  sortedCalendarDatesArbitrary,
} from './helpers';

function dateRange(start: string, end: string): CalendarDateRange {
  return new CalendarDateRange(new CalendarDate(start), new CalendarDate(end));
}

describe('CalendarDateRange', () => {
  describe('Test of constructor', () => {
    test('Throw Error if end date is before start date', () => {
      fc.assert(
        fc.property(sortedCalendarDatesArbitrary(2, { maxYear: 9998 }), (datesInOrder) => {
          // Arrange
          const startDate = datesInOrder[1].addDays(1);
          const endDate = datesInOrder[0];

          // Assert
          expect(() => new CalendarDateRange(startDate, endDate)).toThrow(
            "CalendarDateRange Validation Error: end date can't be before the start date.",
          );
        }),
      );
    });

    test('Construct new CalendarDateRange instance if end date is equal to or after start date', () => {
      fc.assert(
        fc.property(sortedCalendarDatesArbitrary(2), (datesInOrder) => {
          // Arrange
          const startDate = datesInOrder[0];
          const endDate = datesInOrder[1];

          // Act
          const dateRange = new CalendarDateRange(startDate, endDate);

          // Assert
          expect(dateRange.start).toEqual(startDate);
          expect(dateRange.end).toEqual(endDate);
        }),
      );
    });

    test('Construct new CalendarDateRange instance with autoArrange option regardless of the order of end and start date', () => {
      fc.assert(
        fc.property(calendarDateArbitrary(), calendarDateArbitrary(), (startDate, endDate) => {
          // Arrange
          const differenceInDays =
            Math.abs(startDate.valueOf() - endDate.valueOf()) / DAY_IN_SECONDS;

          // Act
          const dateRange = new CalendarDateRange(startDate, endDate, { autoArrange: true });

          // Assert
          expect(dateRange.getDifferenceInDays()).toBe(differenceInDays);
          expect(dateRange.start.valueOf()).toBe(Math.min(startDate.valueOf(), endDate.valueOf()));
        }),
      );
    });
  });

  describe('Test of parse', () => {
    test('Throws a validation error if input is not a valid iso string', () => {
      fc.assert(
        fc.property(fc.string(), (string) => {
          // Arrange
          const stringWithoutSlash = string.replace(new RegExp(/\//g), '');

          // Assert
          expect(() => CalendarDateRange.parse(stringWithoutSlash)).toThrow(
            `CalendarDateRange Validation Error: Input ${stringWithoutSlash.toString()} is not valid, it should follow the pattern YYYY-MM-DD/YYYY-MM-DD.`,
          );
        }),
      );
    });

    test.each([
      [
        '2020-01-01/2020-01-02/2020-01-03',
        'CalendarDateRange Validation Error: Input 2020-01-01/2020-01-02/2020-01-03 is not valid, it should follow the pattern YYYY-MM-DD/YYYY-MM-DD.',
      ],
      [
        '2020-02-01/2020-01-01',
        "CalendarDateRange Validation Error: end date can't be before the start date.",
      ],
      [
        '2020-13-01/2020-12-31',
        'CalendarDate Validation Error: Input month 13 is not valid. Month must be a number between 1 and 12.',
      ],
    ])('Throws a validation error for the input %s', (isoString, message) => {
      expect(() => CalendarDateRange.parse(isoString)).toThrow(message);
    });

    test('Returns a new CalendarDateRange instance for a valid iso string input', () => {
      fc.assert(
        fc.property(calendarDateRangeArbitrary(), (dateRangeBase) => {
          // Arrange
          const isoString = `${dateRangeBase.start.toString()}/${dateRangeBase.end.toString()}`;

          // Act
          const dateRange = CalendarDateRange.parse(isoString);

          // Assert
          expect(dateRange.equals(dateRangeBase)).toBe(true);
        }),
      );
    });
  });

  describe('Test of toString', () => {
    test('The returned string is in ISO format', () => {
      const format = ({ year, month, day }: CalendarDate) =>
        `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
          .toString()
          .padStart(2, '0')}`;
      fc.assert(
        fc.property(calendarDateRangeArbitrary(), (dateRange) => {
          // Act
          const isoString = dateRange.toString();

          // Assert
          expect(isoString).toBe(`${format(dateRange.start)}/${format(dateRange.end)}`);
        }),
      );
    });

    test('Round trips through parse', () => {
      fc.assert(
        fc.property(calendarDateRangeArbitrary(), (dateRange) => {
          // Act
          const parsed = CalendarDateRange.parse(dateRange.toString());

          // Assert
          expect(parsed.equals(dateRange)).toBe(true);
        }),
      );
    });
  });

  describe('Test of toJSON', () => {
    test('Is serialized as the ISO string', () => {
      // Assert
      expect(JSON.stringify({ r: dateRange('2020-01-01', '2020-01-31') })).toBe(
        '{"r":"2020-01-01/2020-01-31"}',
      );
    });

    test('Round trips through JSON.stringify and parse', () => {
      fc.assert(
        fc.property(calendarDateRangeArbitrary(), (dateRange) => {
          // Act
          const parsed = CalendarDateRange.parse(JSON.parse(JSON.stringify(dateRange)));

          // Assert
          expect(parsed.equals(dateRange)).toBe(true);
        }),
      );
    });
  });

  describe('Test of equals', () => {
    test('Returns true if the input date range has the same start and end date', () => {
      fc.assert(
        fc.property(calendarDateRangeArbitrary(), (dateRange1) => {
          // Arrange
          const dateRange2 = new CalendarDateRange(
            new CalendarDate(dateRange1.start.toString()),
            new CalendarDate(dateRange1.end.toString()),
          );

          // Assert
          expect(dateRange1.equals(dateRange2)).toBe(true);
        }),
      );
    });

    test('Returns false if the input date range has a different start date.', () => {
      fc.assert(
        fc.property(
          calendarDateRangeArbitrary({ minYear: 4, maxYear: 9996 }),
          fc.integer({ min: -1000, max: -1 }),
          (dateRange1, offset) => {
            // Arrange
            const dateRange2 = new CalendarDateRange(
              dateRange1.start.addDays(offset),
              dateRange1.end,
              { autoArrange: true },
            );

            // Assert
            expect(dateRange1.equals(dateRange2)).toBe(false);
          },
        ),
      );
    });

    test('Returns false if the input date range has a different end date.', () => {
      fc.assert(
        fc.property(
          calendarDateRangeArbitrary({ minYear: 4, maxYear: 9996 }),
          fc.integer({ min: 1, max: 1000 }),
          (dateRange1, offset) => {
            // Arrange
            const dateRange2 = new CalendarDateRange(
              dateRange1.start,
              dateRange1.end.addDays(offset),
              { autoArrange: true },
            );

            // Assert
            expect(dateRange1.equals(dateRange2)).toBe(false);
          },
        ),
      );
    });

    test('Returns false if the input date range has a different start and end date.', () => {
      fc.assert(
        fc.property(
          calendarDateRangeArbitrary({ minYear: 4, maxYear: 9996 }),
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: 1, max: 1000 }),
          (dateRange1, offset1, offset2) => {
            // Arrange
            const dateRange2 = new CalendarDateRange(
              dateRange1.start.addDays(offset1),
              dateRange1.end.addDays(offset2),
              { autoArrange: true },
            );

            // Assert
            expect(dateRange1.equals(dateRange2)).toBe(false);
          },
        ),
      );
    });
  });

  describe('Test of getTotalDays', () => {
    test('Result should be number of days added to the start plus 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 0, max: 9900 }),
          (year, month, day, addedDays) => {
            // Arrange
            const date1 = new CalendarDate(year, month, ensureValidDay(year, month, day));
            const date2 = date1.addDays(addedDays);
            const dateRange1 = new CalendarDateRange(date1, date2);

            // Assert
            expect(dateRange1.getTotalDays()).toBe(addedDays + 1);
          },
        ),
      );
    });
  });

  describe('Test of getDifferenceInDays', () => {
    test('Result should always be equal to or greater than zero', () => {
      fc.assert(
        fc.property(calendarDateRangeArbitrary(), (dateRange1) => {
          // Assert
          expect(dateRange1.getDifferenceInDays()).toBeGreaterThanOrEqual(0);
        }),
      );
    });
  });

  describe('Test of getDifferenceInMonths', () => {
    test('Result should be zero for the same year and month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          (year1, month1, day1, day2) => {
            // Arrange
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day2));
            const dateRange1 = new CalendarDateRange(date1, date2, { autoArrange: true });

            // Assert
            expect(dateRange1.getDifferenceInMonths()).toBe(0);
          },
        ),
      );
    });

    test('Result is the amount of months added to the start date', () => {
      fc.assert(
        fc.property(
          calendarDateArbitrary({ maxYear: 9899 }),
          fc.integer({ min: 0, max: 1200 }),
          (startDate, monthsAdded) => {
            // Arrange
            const dateRange = new CalendarDateRange(startDate, startDate.addMonths(monthsAdded));

            // Act
            const differenceInMonths = dateRange.getDifferenceInMonths();

            // Assert
            expect(differenceInMonths).toBe(monthsAdded);
          },
        ),
      );
    });

    test('Different test cases', () => {
      // Arrange
      const date1 = new CalendarDate('2020-05-15');
      const date2 = new CalendarDate('2022-02-01');
      const dateRange1 = new CalendarDateRange(date1, date2);

      const date3 = new CalendarDate('2018-02-28');
      const date4 = new CalendarDate('2018-03-01');
      const dateRange2 = new CalendarDateRange(date3, date4);

      const date5 = new CalendarDate('2015-05-12');
      const date6 = new CalendarDate('2016-08-28');
      const dateRange3 = new CalendarDateRange(date5, date6);

      // Assert
      expect(dateRange1.getDifferenceInMonths()).toBe(21);
      expect(dateRange2.getDifferenceInMonths()).toBe(1);
      expect(dateRange3.getDifferenceInMonths()).toBe(15);
    });

    test.each([
      ['2019-12-31', '2020-01-01', 1],
      ['2019-12-01', '2020-11-30', 11],
      ['2019-01-31', '2020-01-01', 12],
      ['2019-11-15', '2021-02-14', 15],
    ])('Counts the months across a year boundary from %s to %s', (start, end, expected) => {
      expect(dateRange(start, end).getDifferenceInMonths()).toBe(expected);
    });
  });

  describe('Test of includes', () => {
    describe('Input type CalendarDate', () => {
      test('Return false if the input date is before the start date or after the end date of the dateRange', () => {
        fc.assert(
          fc.property(
            sortedCalendarDatesArbitrary(4, { minYear: 2, maxYear: 9998 }),
            (datesInOrder) => {
              // Arrange
              const dateRange = new CalendarDateRange(datesInOrder[1], datesInOrder[2]);
              const dateBefore = datesInOrder[0].addDays(-1);
              const dateAfter = datesInOrder[3].addDays(1);

              // Assert
              expect(dateRange.includes(dateAfter)).toBe(false);
              expect(dateRange.includes(dateBefore)).toBe(false);
            },
          ),
        );
      });

      test('Return false if the input date is the same as the start date of the dateRange and excludeStart option is true', () => {
        fc.assert(
          fc.property(sortedCalendarDatesArbitrary(2), (datesInOrder) => {
            // Arrange
            const dateRange = new CalendarDateRange(datesInOrder[0], datesInOrder[1]);

            // Assert
            expect(dateRange.includes(datesInOrder[0], { excludeStart: true })).toBe(false);
            expect(dateRange.includes(datesInOrder[0])).toBe(true);
          }),
        );
      });

      test('Return false if the input date is the same as the end date of the dateRange and excludeEnd option is true', () => {
        fc.assert(
          fc.property(sortedCalendarDatesArbitrary(2), (datesInOrder) => {
            // Arrange
            const dateRange = new CalendarDateRange(datesInOrder[0], datesInOrder[1]);

            // Assert
            expect(dateRange.includes(datesInOrder[1], { excludeEnd: true })).toBe(false);
            expect(dateRange.includes(datesInOrder[1])).toBe(true);
          }),
        );
      });

      test('Return true if the input date is inside the dateRange', () => {
        fc.assert(
          fc.property(sortedCalendarDatesArbitrary(3), (datesInOrder) => {
            // Arrange
            const dateRange = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);

            // Assert
            expect(dateRange.includes(datesInOrder[1])).toBe(true);
          }),
        );
      });
    });

    describe('Input type CalendarDateRange', () => {
      test('Return false if the start date of the input date range is not inside the base date range ', () => {
        fc.assert(
          fc.property(
            sortedCalendarDatesArbitrary(4, { minYear: 2, maxYear: 9998 }),
            (datesInOrder) => {
              // Arrange
              const dateRangeBase = new CalendarDateRange(datesInOrder[1], datesInOrder[3]);
              const dateRangeInput = new CalendarDateRange(
                datesInOrder[0].addDays(-1),
                datesInOrder[2],
              );

              // Assert
              expect(dateRangeBase.includes(dateRangeInput)).toBe(false);
            },
          ),
        );
      });

      test('Return false if the end date of the input date range is not inside the base date range ', () => {
        fc.assert(
          fc.property(
            sortedCalendarDatesArbitrary(4, { minYear: 2, maxYear: 9998 }),
            (datesInOrder) => {
              // Arrange
              const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);
              const dateRangeInput = new CalendarDateRange(
                datesInOrder[1],
                datesInOrder[3].addDays(1),
              );

              // Assert
              expect(dateRangeBase.includes(dateRangeInput)).toBe(false);
            },
          ),
        );
      });

      test('Return false if both the end and start date of the input date range are not inside the base date range ', () => {
        fc.assert(
          fc.property(
            sortedCalendarDatesArbitrary(4, { minYear: 2, maxYear: 9998 }),
            (datesInOrder) => {
              // Arrange
              const dateRangeBase = new CalendarDateRange(datesInOrder[1], datesInOrder[2]);
              const dateRangeInput = new CalendarDateRange(
                datesInOrder[0].addDays(-1),
                datesInOrder[3].addDays(1),
              );

              // Assert
              expect(dateRangeBase.includes(dateRangeInput)).toBe(false);
            },
          ),
        );
      });

      test('Return false if the start date of the input date range is the same as the base start date and excludeStart option is true ', () => {
        fc.assert(
          fc.property(sortedCalendarDatesArbitrary(3), (datesInOrder) => {
            // Arrange
            const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);
            const dateRangeInput = new CalendarDateRange(datesInOrder[0], datesInOrder[1]);

            // Assert
            expect(dateRangeBase.includes(dateRangeInput, { excludeStart: true })).toBe(false);
            expect(dateRangeBase.includes(dateRangeInput)).toBe(true);
          }),
        );
      });

      test('Return false if the end date of the input date range is the same as the base end date and excludeEnd option is true ', () => {
        fc.assert(
          fc.property(sortedCalendarDatesArbitrary(3), (datesInOrder) => {
            // Arrange
            const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);
            const dateRangeInput = new CalendarDateRange(datesInOrder[1], datesInOrder[2]);

            // Assert
            expect(dateRangeBase.includes(dateRangeInput, { excludeEnd: true })).toBe(false);
            expect(dateRangeBase.includes(dateRangeInput)).toBe(true);
          }),
        );
      });

      test('Return true if both start and end dates of the input date range are inside the base date range ', () => {
        fc.assert(
          fc.property(sortedCalendarDatesArbitrary(4), (datesInOrder) => {
            // Arrange
            const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[3]);
            const dateRangeInput = new CalendarDateRange(datesInOrder[1], datesInOrder[2]);

            // Assert
            expect(dateRangeBase.includes(dateRangeInput)).toBe(true);
          }),
        );
      });
    });
  });

  describe('Test of open ended date ranges with CalendarDate.MIN_VALUE and CalendarDate.MAX_VALUE', () => {
    test('A range with an open end includes every date after its start', () => {
      // Arrange
      const dateRange = new CalendarDateRange(
        new CalendarDate('2024-01-01'),
        CalendarDate.MAX_VALUE,
      );

      // Assert
      expect(dateRange.includes(new CalendarDate('2024-01-01'))).toBe(true);
      expect(dateRange.includes(new CalendarDate('9999-12-31'))).toBe(true);
      expect(dateRange.includes(new CalendarDate('2023-12-31'))).toBe(false);
    });

    test('A range with an open start includes every date before its end', () => {
      // Arrange
      const dateRange = new CalendarDateRange(
        CalendarDate.MIN_VALUE,
        new CalendarDate('2023-12-31'),
      );

      // Assert
      expect(dateRange.includes(new CalendarDate('2023-12-31'))).toBe(true);
      expect(dateRange.includes(new CalendarDate('0001-01-01'))).toBe(true);
      expect(dateRange.includes(new CalendarDate('2024-01-01'))).toBe(false);
    });
  });

  describe('Test of hasGaps', () => {
    const january = dateRange('2020-01-01', '2020-01-31');
    const bothOptions = { excludeStart: true, excludeEnd: true };

    test.each([
      ['an empty array', [], undefined, false],
      ['a single date range', [january], undefined, false],
      [
        'overlapping date ranges',
        [january, dateRange('2020-01-15', '2020-02-15')],
        undefined,
        false,
      ],
      [
        'a date range included in another date range',
        [january, dateRange('2020-01-10', '2020-01-20')],
        undefined,
        false,
      ],
      [
        'adjacent date ranges',
        [january, dateRange('2020-02-01', '2020-02-15'), dateRange('2020-02-06', '2020-03-01')],
        undefined,
        false,
      ],
      [
        'date ranges with gaps',
        [january, dateRange('2020-02-01', '2020-02-15'), dateRange('2020-02-20', '2020-03-01')],
        undefined,
        true,
      ],
      [
        'adjacent date ranges with excludeStart',
        [january, dateRange('2020-02-01', '2020-02-15')],
        { excludeStart: true },
        true,
      ],
      [
        'date ranges sharing a day with excludeStart',
        [january, dateRange('2020-01-31', '2020-02-15')],
        { excludeStart: true },
        false,
      ],
      [
        'adjacent date ranges with excludeEnd',
        [january, dateRange('2020-02-01', '2020-02-15')],
        { excludeEnd: true },
        true,
      ],
      [
        'date ranges sharing a day with excludeEnd',
        [january, dateRange('2020-01-31', '2020-02-15')],
        { excludeEnd: true },
        false,
      ],
      // With both options, january covers 01-02 to 01-30.
      [
        'adjacent date ranges with excludeStart and excludeEnd',
        [january, dateRange('2020-02-01', '2020-02-15')],
        bothOptions,
        true,
      ],
      [
        'date ranges sharing a day with excludeStart and excludeEnd',
        [january, dateRange('2020-01-31', '2020-02-15')],
        bothOptions,
        true,
      ],
      [
        'date ranges overlapping by one day with excludeStart and excludeEnd',
        [january, dateRange('2020-01-30', '2020-02-15')],
        bothOptions,
        false,
      ],
    ])('Should handle %s', (_, ranges, options, expected) => {
      // Act
      const result = CalendarDateRange.hasGaps(ranges, options);

      // Assert
      expect(result).toBe(expected);
    });

    test('Should compare a date range only with its neighbour, even if an earlier date range covers the gap', () => {
      // Arrange
      const year = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-12-31'),
      );
      const february = new CalendarDateRange(
        new CalendarDate('2020-02-01'),
        new CalendarDate('2020-02-05'),
      );
      const march = new CalendarDateRange(
        new CalendarDate('2020-03-01'),
        new CalendarDate('2020-03-05'),
      );

      // Act
      const result = CalendarDateRange.hasGaps([year, february, march]);

      // Assert
      // Sorted by start, february and march are neighbours with a gap between them.
      expect(result).toBe(true);
    });

    test('Should not modify the input array', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2021-01-01'),
        new CalendarDate('2021-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const values = [dateRange1, dateRange2];

      // Act
      CalendarDateRange.hasGaps(values);

      // Assert
      expect(values[0]).toBe(dateRange1);
      expect(values[1]).toBe(dateRange2);
    });
  });

  describe('hasGaps and hasOverlap with date ranges that start on the same day', () => {
    test('should not depend on the order of the input array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 5 })), {
            maxLength: 5,
          }),
          fc.boolean(),
          fc.boolean(),
          (offsetsAndLengths, excludeStart, excludeEnd) => {
            // Arrange
            const base = new CalendarDate(2020, 1, 1);
            const ranges = offsetsAndLengths.map(
              ([offset, length]) =>
                new CalendarDateRange(base.addDays(offset), base.addDays(offset + length)),
            );
            const reversed = [...ranges].reverse();
            const options = { excludeStart, excludeEnd };

            // Assert
            expect(CalendarDateRange.hasGaps(reversed, options)).toBe(
              CalendarDateRange.hasGaps(ranges, options),
            );
            expect(CalendarDateRange.hasOverlap(reversed, options)).toBe(
              CalendarDateRange.hasOverlap(ranges, options),
            );
          },
        ),
        { numRuns: 1000 },
      );
    });

    test.each([
      [false, true],
      [true, false],
    ])(
      'should compare the shorter date range first (excludeStart %s, excludeEnd %s)',
      (excludeStart, excludeEnd) => {
        // Arrange
        // With one of the options, a single-day range covers no days and can't overlap.
        const singleDay = new CalendarDateRange(
          new CalendarDate('2020-01-01'),
          new CalendarDate('2020-01-01'),
        );
        const month = new CalendarDateRange(
          new CalendarDate('2020-01-01'),
          new CalendarDate('2020-01-31'),
        );
        const options = { excludeStart, excludeEnd };

        // Assert
        expect(CalendarDateRange.hasOverlap([singleDay, month], options)).toBe(false);
        expect(CalendarDateRange.hasOverlap([month, singleDay], options)).toBe(false);
      },
    );
  });

  describe('Test of hasOverlap', () => {
    const january = dateRange('2020-01-01', '2020-01-31');
    const bothOptions = { excludeStart: true, excludeEnd: true };

    test.each([
      ['an empty array', [], undefined, false],
      ['a single date range', [january], undefined, false],
      [
        'non-overlapping date ranges',
        [january, dateRange('2020-02-01', '2020-02-15')],
        undefined,
        false,
      ],
      [
        'overlapping date ranges',
        [january, dateRange('2020-01-15', '2020-02-15')],
        undefined,
        true,
      ],
      [
        'one date range inside another date range',
        [january, dateRange('2020-01-10', '2020-01-20')],
        undefined,
        true,
      ],
      [
        'date ranges sharing a day with excludeStart',
        [january, dateRange('2020-01-31', '2020-02-15')],
        { excludeStart: true },
        false,
      ],
      [
        'date ranges overlapping by one day with excludeStart',
        [january, dateRange('2020-01-30', '2020-02-15')],
        { excludeStart: true },
        true,
      ],
      [
        'date ranges sharing a day with excludeEnd',
        [january, dateRange('2020-01-31', '2020-02-15')],
        { excludeEnd: true },
        false,
      ],
      [
        'date ranges overlapping by one day with excludeEnd',
        [january, dateRange('2020-01-30', '2020-02-15')],
        { excludeEnd: true },
        true,
      ],
      // With both options, january covers 01-02 to 01-30.
      [
        'date ranges overlapping by one day with excludeStart and excludeEnd',
        [january, dateRange('2020-01-30', '2020-02-15')],
        bothOptions,
        false,
      ],
      [
        'date ranges overlapping by two days with excludeStart and excludeEnd',
        [january, dateRange('2020-01-29', '2020-02-15')],
        bothOptions,
        true,
      ],
    ])('Should handle %s', (_, ranges, options, expected) => {
      // Act
      const result = CalendarDateRange.hasOverlap(ranges, options);

      // Assert
      expect(result).toBe(expected);
    });

    test('Should find every overlap, also between date ranges that are not neighbours', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.integer({ min: 0, max: 60 }), fc.integer({ min: 0, max: 20 })), {
            maxLength: 6,
          }),
          fc.boolean(),
          fc.boolean(),
          (offsetsAndLengths, excludeStart, excludeEnd) => {
            // Arrange
            const base = new CalendarDate(2020, 1, 1);
            const ranges = offsetsAndLengths.map(
              ([offset, length]) =>
                new CalendarDateRange(base.addDays(offset), base.addDays(offset + length)),
            );
            // A range that covers no days has its first covered day after its last one.
            const coveredDays = ranges.map((range) => ({
              first: range.start.addDays(excludeStart ? 1 : 0).valueOf(),
              last: range.end.addDays(excludeEnd ? -1 : 0).valueOf(),
            }));
            const hasOverlappingPair = coveredDays.some((a, i) =>
              coveredDays.some(
                (b, j) => i < j && Math.max(a.first, b.first) <= Math.min(a.last, b.last),
              ),
            );

            // Act
            const result = CalendarDateRange.hasOverlap(ranges, { excludeStart, excludeEnd });

            // Assert
            expect(result).toBe(hasOverlappingPair);
          },
        ),
        { numRuns: 1000 },
      );
    });

    test.each([
      ['excludeStart', [dateRange('2020-01-10', '2020-01-10')], { excludeStart: true }],
      ['excludeEnd', [dateRange('2020-01-10', '2020-01-10')], { excludeEnd: true }],
      [
        'excludeStart and excludeEnd',
        [dateRange('2020-01-10', '2020-01-11'), dateRange('2020-01-20', '2020-01-20')],
        bothOptions,
      ],
    ])('Should ignore date ranges that cover no days with %s', (_, emptyDateRanges, options) => {
      // Act
      const result = CalendarDateRange.hasOverlap([january, ...emptyDateRanges], options);

      // Assert
      expect(result).toBe(false);
    });

    test('Should not modify the input array', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2021-01-01'),
        new CalendarDate('2021-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const values = [dateRange1, dateRange2];

      // Act
      CalendarDateRange.hasOverlap(values);

      // Assert
      expect(values[0]).toBe(dateRange1);
      expect(values[1]).toBe(dateRange2);
    });
  });

  describe('Test of iterateDatesInRange', () => {
    test('should iterate through all dates in a single-day range', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-01'),
      );
      const dates = Array.from(range.iterateDatesInRange());

      expect(dates).toHaveLength(1);
      expect(dates[0].equals(new CalendarDate('2023-01-01'))).toBe(true);
    });

    test('should iterate through all dates in a multi-day range', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-03'),
      );
      const dates = Array.from(range.iterateDatesInRange());

      expect(dates).toHaveLength(3);
      expect(dates[0].equals(new CalendarDate('2023-01-01'))).toBe(true);
      expect(dates[1].equals(new CalendarDate('2023-01-02'))).toBe(true);
      expect(dates[2].equals(new CalendarDate('2023-01-03'))).toBe(true);
    });

    test('should iterate through dates across month boundaries', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-30'),
        new CalendarDate('2023-02-02'),
      );
      const dates = Array.from(range.iterateDatesInRange());

      expect(dates).toHaveLength(4);
      expect(dates[0].equals(new CalendarDate('2023-01-30'))).toBe(true);
      expect(dates[1].equals(new CalendarDate('2023-01-31'))).toBe(true);
      expect(dates[2].equals(new CalendarDate('2023-02-01'))).toBe(true);
      expect(dates[3].equals(new CalendarDate('2023-02-02'))).toBe(true);
    });

    test('should iterate through dates across year boundaries', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2022-12-30'),
        new CalendarDate('2023-01-02'),
      );
      const dates = Array.from(range.iterateDatesInRange());

      expect(dates.map(String)).toEqual(['2022-12-30', '2022-12-31', '2023-01-01', '2023-01-02']);
    });

    test('should exclude start date when excludeStart option is true', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-03'),
      );
      const dates = Array.from(range.iterateDatesInRange({ excludeStart: true }));

      expect(dates).toHaveLength(2);
      expect(dates[0].equals(new CalendarDate('2023-01-02'))).toBe(true);
      expect(dates[1].equals(new CalendarDate('2023-01-03'))).toBe(true);
    });

    test('should exclude end date when excludeEnd option is true', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-03'),
      );
      const dates = Array.from(range.iterateDatesInRange({ excludeEnd: true }));

      expect(dates).toHaveLength(2);
      expect(dates[0].equals(new CalendarDate('2023-01-01'))).toBe(true);
      expect(dates[1].equals(new CalendarDate('2023-01-02'))).toBe(true);
    });

    test('should exclude both start and end dates when both options are true', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-05'),
      );
      const dates = Array.from(range.iterateDatesInRange({ excludeStart: true, excludeEnd: true }));

      expect(dates).toHaveLength(3);
      expect(dates[0].equals(new CalendarDate('2023-01-02'))).toBe(true);
      expect(dates[1].equals(new CalendarDate('2023-01-03'))).toBe(true);
      expect(dates[2].equals(new CalendarDate('2023-01-04'))).toBe(true);
    });

    test('should return empty array when excluding both dates from single-day range', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-01'),
      );
      const dates = Array.from(range.iterateDatesInRange({ excludeStart: true, excludeEnd: true }));

      expect(dates).toHaveLength(0);
    });

    test('should work with for...of loop', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-02'),
      );
      const dates: CalendarDate[] = [];

      for (const date of range.iterateDatesInRange()) {
        dates.push(date);
      }

      expect(dates).toHaveLength(2);
      expect(dates[0].equals(new CalendarDate('2023-01-01'))).toBe(true);
      expect(dates[1].equals(new CalendarDate('2023-01-02'))).toBe(true);
    });
  });

  describe('Test of Symbol.iterator', () => {
    test('should yield the same dates as iterateDatesInRange', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          fc.integer({ min: 0, max: 100 }),
          (startOffset, length) => {
            // Arrange
            const start = new CalendarDate(2000, 1, 1).addDays(startOffset);
            const range = new CalendarDateRange(start, start.addDays(length));

            // Act
            const dates = [...range];

            // Assert
            expect(dates.map(String)).toEqual([...range.iterateDatesInRange()].map(String));
          },
        ),
      );
    });

    test('should work with for...of', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-30'),
        new CalendarDate('2023-02-02'),
      );
      const dates: string[] = [];

      for (const date of range) {
        dates.push(date.toString());
      }

      expect(dates).toEqual(['2023-01-30', '2023-01-31', '2023-02-01', '2023-02-02']);
    });

    test('should start a new iteration each time', () => {
      const range = new CalendarDateRange(
        new CalendarDate('2023-01-01'),
        new CalendarDate('2023-01-02'),
      );

      expect([...range].map(String)).toEqual(['2023-01-01', '2023-01-02']);
      expect([...range].map(String)).toEqual(['2023-01-01', '2023-01-02']);
    });
  });

  describe('Iteration at the edges of the representable range', () => {
    const lastTwoDays = new CalendarDateRange(
      new CalendarDate(9999, 12, 30),
      CalendarDate.MAX_VALUE,
    );
    const firstTwoDays = new CalendarDateRange(CalendarDate.MIN_VALUE, new CalendarDate(1, 1, 2));
    const maxValueOnly = new CalendarDateRange(CalendarDate.MAX_VALUE, CalendarDate.MAX_VALUE);
    const minValueOnly = new CalendarDateRange(CalendarDate.MIN_VALUE, CalendarDate.MIN_VALUE);

    test.each([
      ['ending at MAX_VALUE', lastTwoDays, {}, ['9999-12-30', '9999-12-31']],
      ['ending at MAX_VALUE excluding start', lastTwoDays, { excludeStart: true }, ['9999-12-31']],
      ['starting at MIN_VALUE', firstTwoDays, {}, ['0001-01-01', '0001-01-02']],
      ['starting at MIN_VALUE excluding end', firstTwoDays, { excludeEnd: true }, ['0001-01-01']],
      ['MAX_VALUE only excluding start', maxValueOnly, { excludeStart: true }, []],
      ['MIN_VALUE only excluding end', minValueOnly, { excludeEnd: true }, []],
      ['MAX_VALUE only excluding both', maxValueOnly, { excludeStart: true, excludeEnd: true }, []],
    ])('returns the dates of a range %s', (_, range, options, expected) => {
      expect(range.toDatesArrayInRange(options).map(String)).toEqual(expected);
      expect([...range.iterateDatesInRange(options)].map(String)).toEqual(expected);
    });
  });

  describe('Test of toDatesArrayInRange', () => {
    test('should return the same dates as iterateDatesInRange', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          fc.boolean(),
          (startOffset, length, excludeStart, excludeEnd) => {
            // Arrange
            const start = new CalendarDate(2000, 1, 1).addDays(startOffset);
            const range = new CalendarDateRange(start, start.addDays(length));
            const options = { excludeStart, excludeEnd };

            // Act
            const dates = range.toDatesArrayInRange(options);

            // Assert
            expect(dates.map(String)).toEqual([...range.iterateDatesInRange(options)].map(String));
          },
        ),
      );
    });
  });
});
