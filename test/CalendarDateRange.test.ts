import * as fc from 'fast-check';
import { CalendarDate, CalendarDateRange } from 'calendar-date';
import { DAY_IN_SECONDS, ensureValidDay, unixTimestampToCalendarDate } from './helpers';

describe('CalendarDateRange', () => {
  describe('Test of constructor', () => {
    test('Throw Error if end date is before start date', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 2, maxLength: 2 }),
          (data) => {
            // Arrange
            const datesInOrder = data
              .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
              .sort();
            const startDate = datesInOrder[1].addDays(1);
            const endDate = datesInOrder[0];

            // Assert
            expect(() => new CalendarDateRange(startDate, endDate)).toThrowError(
              "CalendarDateRange Validation Error: end date can't be before the start date.",
            );
          },
        ),
      );
    });

    test('Construct new CalendarDateRange instance if end date ist equal to or after start date', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 2, maxLength: 2 }),
          (data) => {
            // Arrange
            const datesInOrder = data
              .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
              .sort();
            const startDate = datesInOrder[0];
            const endDate = datesInOrder[1];

            // Act
            const dateRange = new CalendarDateRange(startDate, endDate);

            // Assert
            expect(dateRange.start).toEqual(startDate);
            expect(dateRange.end).toEqual(endDate);
          },
        ),
      );
    });

    test('Construct new CalendarDateRange instance with autoArrange option regardless of the order of end and start date if ', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 2, maxLength: 2 }),
          (data) => {
            // Arrange
            const datesUnordered = data.map((number) =>
              unixTimestampToCalendarDate(number * DAY_IN_SECONDS),
            );
            const startDate = datesUnordered[0];
            const endDate = datesUnordered[1];
            const differenceInDays = Math.abs(data[1] - data[0]);

            // Act
            const dateRange = new CalendarDateRange(startDate, endDate, true);

            // Assert
            expect(dateRange.getDifferenceInDays()).toBe(differenceInDays);
          },
        ),
      );
    });
  });

  describe('Test of parseString', () => {
    test('Throws a validation error if input is not a valid iso string', () => {
      fc.assert(
        fc.property(fc.string(), (string) => {
          // Arrange
          const stringWithoutSlash = string.replace(new RegExp(/\//g), '');

          // Assert
          expect(() => CalendarDateRange.parse(stringWithoutSlash)).toThrowError(
            `CalendarDateRange Validation Error: Input ${stringWithoutSlash.toString()} is not valid, it should follow the pattern YYYY-MM-DD/YYYY-MM-DD.`,
          );
        }),
      );
    });

    test('Returns a new CalendarDateRange instance for a valid iso string input', () => {
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
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRangeBase = new CalendarDateRange(date1, date2, true);
            const isoString = `${dateRangeBase.start.toString()}/${dateRangeBase.end.toString()}`;

            // Act
            const dateRange = CalendarDateRange.parse(isoString);

            // Assert
            expect(dateRange.equals(dateRangeBase)).toBe(true);
          },
        ),
      );
    });
  });

  describe('Test of toString', () => {
    test('The returned string is in ISO format', () => {
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
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange = new CalendarDateRange(date1, date2, true);

            // Act
            const isoString = dateRange.toString();

            // Assert
            expect(isoString.length).toBe(21);
            expect(isoString.charAt(4)).toBe('-');
            expect(isoString.charAt(7)).toBe('-');
            expect(isoString.charAt(10)).toBe('/');
            expect(isoString.charAt(15)).toBe('-');
            expect(isoString.charAt(18)).toBe('-');
          },
        ),
      );
    });
  });

  describe('Test of toJSON', () => {
    test('The returned string is the same as from toString', () => {
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
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange = new CalendarDateRange(date1, date2, true);

            // Assert
            expect(dateRange.toJSON()).toBe(dateRange.toString());
          },
        ),
      );
    });
  });

  describe('Test of equals', () => {
    test('Returns true if the input date range has the same start and end date', () => {
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
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange1 = new CalendarDateRange(date1, date2, true);
            const dateRange2 = new CalendarDateRange(date1, date2, true);

            // Assert
            expect(dateRange1.equals(dateRange2)).toBe(true);
          },
        ),
      );
    });

    test('Returns false if the input date range has a different start date.', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -1000, max: -1 }),
          (year1, year2, month1, month2, day1, day2, offset) => {
            // Arrange
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange1 = new CalendarDateRange(date1, date2, true);
            const dateRange2 = new CalendarDateRange(
              dateRange1.start.addDays(offset),
              dateRange1.end,
              true,
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
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 1000 }),
          (year1, year2, month1, month2, day1, day2, offset) => {
            // Arrange
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange1 = new CalendarDateRange(date1, date2, true);
            const dateRange2 = new CalendarDateRange(
              dateRange1.start,
              dateRange1.end.addDays(offset),
              true,
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
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: 1, max: 1000 }),
          (year1, year2, month1, month2, day1, day2, offset1, offset2) => {
            // Arrange
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange1 = new CalendarDateRange(date1, date2, true);
            const dateRange2 = new CalendarDateRange(
              dateRange1.start.addDays(offset1),
              dateRange1.end.addDays(offset2),
              true,
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
        fc.property(
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 200, max: 9900 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 31 }),
          fc.integer({ min: 1, max: 31 }),
          (year1, year2, month1, month2, day1, day2) => {
            // Arrange
            const date1 = new CalendarDate(year1, month1, ensureValidDay(year1, month1, day1));
            const date2 = new CalendarDate(year2, month2, ensureValidDay(year2, month2, day2));
            const dateRange1 = new CalendarDateRange(date1, date2, true);

            // Assert
            expect(dateRange1.getDifferenceInDays()).toBeGreaterThanOrEqual(0);
          },
        ),
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
            const dateRange1 = new CalendarDateRange(date1, date2, true);

            // Assert
            expect(dateRange1.getDifferenceInMonths()).toBe(0);
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
  });

  describe('Test of includes', () => {
    describe('Input type CalendarDate', () => {
      test('Return false if the input date is before the start date or after the end date of the dateRange', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 4, maxLength: 4 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
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
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 2, maxLength: 2 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
              const dateRange = new CalendarDateRange(datesInOrder[0], datesInOrder[1]);

              // Assert
              expect(dateRange.includes(datesInOrder[0], { excludeStart: true })).toBe(false);
              expect(dateRange.includes(datesInOrder[0])).toBe(true);
            },
          ),
        );
      });

      test('Return false if the input date is the same as the end date of the dateRange and excludeEnd option is true', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 2, maxLength: 2 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
              const dateRange = new CalendarDateRange(datesInOrder[0], datesInOrder[1]);

              // Assert
              expect(dateRange.includes(datesInOrder[1], { excludeEnd: true })).toBe(false);
              expect(dateRange.includes(datesInOrder[1])).toBe(true);
            },
          ),
        );
      });

      test('Return true if the input date is inside the dateRange', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 3, maxLength: 3 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
              const dateRange = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);

              // Assert
              expect(dateRange.includes(datesInOrder[1])).toBe(true);
            },
          ),
        );
      });
    });

    describe('Input type CalendarDateRange', () => {
      test('Return false if the start date of the input date range is not inside the base date range ', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 4, maxLength: 4 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
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
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 4, maxLength: 4 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
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
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 4, maxLength: 4 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
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
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 3, maxLength: 3 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
              const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);
              const dateRangeInput = new CalendarDateRange(datesInOrder[0], datesInOrder[1]);

              // Assert
              expect(dateRangeBase.includes(dateRangeInput, { excludeStart: true })).toBe(false);
              expect(dateRangeBase.includes(dateRangeInput)).toBe(true);
            },
          ),
        );
      });

      test('Return false if the end date of the input date range is the same as the base end date and excludeEnd option is true ', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 3, maxLength: 3 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
              const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[2]);
              const dateRangeInput = new CalendarDateRange(datesInOrder[1], datesInOrder[2]);

              // Assert
              expect(dateRangeBase.includes(dateRangeInput, { excludeEnd: true })).toBe(false);
              expect(dateRangeBase.includes(dateRangeInput)).toBe(true);
            },
          ),
        );
      });

      test('Return true if both start and end dates of the input date range are inside the base date range ', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: -100000, max: 100000 }), { minLength: 4, maxLength: 4 }),
            (data) => {
              // Arrange
              const datesInOrder = data
                .map((number) => unixTimestampToCalendarDate(number * DAY_IN_SECONDS))
                .sort();
              const dateRangeBase = new CalendarDateRange(datesInOrder[0], datesInOrder[3]);
              const dateRangeInput = new CalendarDateRange(datesInOrder[1], datesInOrder[2]);

              // Assert
              expect(dateRangeBase.includes(dateRangeInput)).toBe(true);
            },
          ),
        );
      });
    });
  });

  describe('Test of hasGap', () => {
    test('Should return false for empty array', () => {
      // Act
      const result = CalendarDateRange.hasGaps([]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return false for a single date range', () => {
      // Arrange
      const dateRange = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );

      // Act
      const result = CalendarDateRange.hasGaps([dateRange]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return false for overlapping date ranges', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-01-15'),
        new CalendarDate('2020-02-15'),
      );

      // Act
      const result = CalendarDateRange.hasGaps([dateRange1, dateRange2]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return false for date range included in another date range', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-01-10'),
        new CalendarDate('2020-01-20'),
      );

      // Act
      const result = CalendarDateRange.hasGaps([dateRange1, dateRange2]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return false for adjacent date ranges', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-02-01'),
        new CalendarDate('2020-02-15'),
      );
      const dateRange3 = new CalendarDateRange(
        new CalendarDate('2020-02-06'),
        new CalendarDate('2020-03-01'),
      );

      // Act
      const result = CalendarDateRange.hasGaps([dateRange1, dateRange2, dateRange3]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return true for date ranges with gaps', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-02-01'),
        new CalendarDate('2020-02-15'),
      );
      const dateRange3 = new CalendarDateRange(
        new CalendarDate('2020-02-20'),
        new CalendarDate('2020-03-01'),
      );

      // Act
      const result = CalendarDateRange.hasGaps([dateRange1, dateRange2, dateRange3]);

      // Assert
      expect(result).toBe(true);
    });

    test('Should work for excludeStart option', () => {
      // Arrange
      const ranges1 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-02-01'), new CalendarDate('2020-02-15')),
      ];
      const ranges2 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-01-31'), new CalendarDate('2020-02-15')),
      ];

      // Act
      const result1 = CalendarDateRange.hasGaps(ranges1, {
        excludeStart: true,
      });
      const result2 = CalendarDateRange.hasGaps(ranges2, {
        excludeStart: true,
      });

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('Should work for excludeEnd option', () => {
      // Arrange
      const ranges1 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-02-01'), new CalendarDate('2020-02-15')),
      ];
      const ranges2 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-01-31'), new CalendarDate('2020-02-15')),
      ];

      // Act
      const result1 = CalendarDateRange.hasGaps(ranges1, {
        excludeEnd: true,
      });
      const result2 = CalendarDateRange.hasGaps(ranges2, {
        excludeEnd: true,
      });

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Test of hasOverlap', () => {
    test('Should return false for empty array', () => {
      // Act
      const result = CalendarDateRange.hasOverlap([]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return false for a single date range', () => {
      // Arrange
      const dateRange = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );

      // Act
      const result = CalendarDateRange.hasOverlap([dateRange]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return false for non-overlapping date ranges', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-02-01'),
        new CalendarDate('2020-02-15'),
      );

      // Act
      const result = CalendarDateRange.hasOverlap([dateRange1, dateRange2]);

      // Assert
      expect(result).toBe(false);
    });

    test('Should return true for overlapping date ranges', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-01-15'),
        new CalendarDate('2020-02-15'),
      );

      // Act
      const result = CalendarDateRange.hasOverlap([dateRange1, dateRange2]);

      // Assert
      expect(result).toBe(true);
    });

    test('Should return true for one date range inside another date range', () => {
      // Arrange
      const dateRange1 = new CalendarDateRange(
        new CalendarDate('2020-01-01'),
        new CalendarDate('2020-01-31'),
      );
      const dateRange2 = new CalendarDateRange(
        new CalendarDate('2020-01-10'),
        new CalendarDate('2020-01-20'),
      );

      // Act
      const result = CalendarDateRange.hasOverlap([dateRange1, dateRange2]);

      // Assert
      expect(result).toBe(true);
    });

    test('Should work for excludeStart option', () => {
      // Arrange
      const ranges1 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-01-31'), new CalendarDate('2020-02-15')),
      ];
      const ranges2 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-01-30'), new CalendarDate('2020-02-15')),
      ];

      // Act
      const result1 = CalendarDateRange.hasOverlap(ranges1, {
        excludeStart: true,
      });
      const result2 = CalendarDateRange.hasOverlap(ranges2, {
        excludeStart: true,
      });

      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });

    test('Should work for excludeEnd option', () => {
      // Arrange
      const ranges1 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-01-31'), new CalendarDate('2020-02-15')),
      ];
      const ranges2 = [
        new CalendarDateRange(new CalendarDate('2020-01-01'), new CalendarDate('2020-01-31')),
        new CalendarDateRange(new CalendarDate('2020-01-30'), new CalendarDate('2020-02-15')),
      ];

      // Act
      const result1 = CalendarDateRange.hasOverlap(ranges1, {
        excludeEnd: true,
      });
      const result2 = CalendarDateRange.hasOverlap(ranges2, {
        excludeEnd: true,
      });

      // Assert
      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });
  });
});
