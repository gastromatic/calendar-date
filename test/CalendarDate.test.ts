import * as fc from 'fast-check';
import { CalendarDate } from 'calendar-date';
import { DAY_IN_SECONDS, ensureValidDay } from './helpers';

describe('CalendarDate', () => {
  describe('Test of constructor', () => {
    describe('Input type: year/month/day', () => {
      test('Throws error if second or third inputs are missing', () => {
        fc.assert(
          fc.property(
            fc.integer(200, 9800),
            fc.integer(0, 11),
            fc.integer(1, 31),
            (year, month, day) => {
              // Arrange
              const undefinedAsNumber: number = undefined as unknown as number;

              // Assert
              expect(
                () => new CalendarDate(year, undefinedAsNumber, undefinedAsNumber),
              ).toThrowError(`CalendarDate Validation Error: Input [ ${year} ] is not valid.`);
              expect(() => new CalendarDate(year, month, undefinedAsNumber)).toThrowError(
                `CalendarDate Validation Error: Input [ ${year} , ${month} ] is not valid.`,
              );
              expect(() => new CalendarDate(year, undefinedAsNumber, day)).toThrowError(
                `CalendarDate Validation Error: Input [ ${year} , ${day} ] is not valid.`,
              );
            },
          ),
        );
      });

      test('Throws error if year is below 0 or above 9999', () => {
        fc.assert(
          fc.property(
            fc.integer({ max: -1 }),
            fc.integer({ min: 10000 }),
            fc.integer(0, 11),
            fc.integer(1, 31),
            (yearLowerInterval, yearUpperInterval, month, day) => {
              // Assert
              expect(() => new CalendarDate(yearLowerInterval, month, day)).toThrowError(
                `CalendarDate Validation Error: Input year ${yearLowerInterval} is not valid. Year must be a number between 0 and 9999.`,
              );
              expect(() => new CalendarDate(yearUpperInterval, month, day)).toThrowError(
                `CalendarDate Validation Error: Input year ${yearUpperInterval} is not valid. Year must be a number between 0 and 9999.`,
              );
            },
          ),
        );
      });

      test('Throws error if month is below 0 or above 11', () => {
        fc.assert(
          fc.property(
            fc.integer(0, 9999),
            fc.integer({ max: -1 }),
            fc.integer({ min: 12 }),
            fc.integer(1, 31),
            (year, monthLowerInterval, monthUpperInterval, day) => {
              // Assert
              expect(() => new CalendarDate(year, monthLowerInterval, day)).toThrowError(
                `CalendarDate Validation Error: Input month ${monthLowerInterval} is not valid. Month must be a number between 0 and 11.`,
              );
              expect(() => new CalendarDate(year, monthUpperInterval, day)).toThrowError(
                `CalendarDate Validation Error: Input month ${monthUpperInterval} is not valid. Month must be a number between 0 and 11.`,
              );
            },
          ),
        );
      });

      test('Throws error if day is below 1', () => {
        fc.assert(
          fc.property(
            fc.integer(0, 9999),
            fc.integer(0, 11),
            fc.integer({ max: 0 }),
            (year, month, day) => {
              // Assert
              expect(() => new CalendarDate(year, month, day)).toThrowError(
                `CalendarDate Validation Error: Input day ${day} is not valid. Day must be a number greater than 0.`,
              );
            },
          ),
        );
      });

      test('Throws error if day is not a valid day of month', () => {
        fc.assert(
          fc.property(
            fc.integer(0, 9999),
            fc.integer(0, 11),
            fc.integer({ min: 29 }),
            (year, month, day) => {
              // Arrange
              const maxDayOfMonth = ensureValidDay(year, month, 31);
              day = Math.max(maxDayOfMonth + 1, day);

              // Assert
              expect(() => new CalendarDate(year, month, day)).toThrowError(
                `CalendarDate Validation Error: Input date ${year}-${month}-${day} is not a valid calendar date.`,
              );
            },
          ),
        );
      });

      test('Construct CalendarDate from year, month and day', () => {
        fc.assert(
          fc.property(
            fc.integer(200, 9900),
            fc.integer(0, 11),
            fc.integer(1, 31),
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
    });

    describe('input type: string', () => {
      test('Construct CalendarDate from IsoString', () => {
        fc.assert(
          fc.property(
            fc.integer(200, 9900),
            fc.integer(0, 11),
            fc.integer(1, 31),
            (year, month, day) => {
              // Arrange
              day = ensureValidDay(year, month, day);
              const isoString = `${year.toString().padStart(4, '0')}-${(month + 1)
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

  describe('Test of parseString', () => {
    test('Should throw error if input is not a valid iso string', () => {
      fc.assert(
        fc.property(fc.string(), (string) => {
          expect(() => CalendarDate.parse(string)).toThrowError(
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
            expect(() => CalendarDate.parse(isoString)).toThrowError(
              `CalendarDate Validation Error: Input ${isoString.toString()} is not valid, it should follow the pattern YYYY-MM-DD.`,
            );
          },
        ),
      );
    });

    test('should construct calendar date object from valid iso string', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const isoString = `${year.toString().padStart(4, '0')}-${(month + 1)
              .toString()
              .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            // Act
            const calendarDate = CalendarDate.parse(isoString);

            // Assert
            expect(calendarDate.year).toBe(year);
            expect(calendarDate.month).toBe(month);
            expect(calendarDate.day).toBe(day);
          },
        ),
      );
    });
  });

  describe('Test of toString', () => {
    test('The returned string is in ISO format', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);

            // Act
            const isoString = new CalendarDate(year, month, day).toString();

            // Assert
            expect(isoString.length).toBe(10);
            expect(isoString.charAt(4)).toBe('-');
            expect(isoString.charAt(7)).toBe('-');
          },
        ),
      );
    });
  });

  describe('Test of toFormat', () => {
    test('Should replace all supported tokens correctly', () => {
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
  });

  describe('Test of toJSON', () => {
    test('The returned string is the same as from toString', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const date = new CalendarDate(year, month, day);

            // Assert
            expect(date.toJSON()).toBe(date.toString());
          },
        ),
      );
    });
  });

  describe('Test of toDate', () => {
    test('The returned date object represents the start of the day of the calendarDate in UTC timezone', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
          (year, month, day) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const calendarDate = new CalendarDate(year, month, day);
            const date = calendarDate.toDate();

            // Assert
            expect(date.toISOString()).toEqual(`${calendarDate.toString()}T00:00:00.000Z`);
          },
        ),
      );
    });
  });

  describe('Test of equals', () => {
    test('Returns true if the input object has the same unix timestamp', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
          fc.integer(200, 9900),
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(0, 11),
          fc.integer(1, 31),
          fc.integer(1, 31),
          (year1, year2, month1, month2, day1, day2) => {
            // Arrange
            day1 = ensureValidDay(year1, month1, day1);
            day2 = ensureValidDay(year2, month2, day2);
            const date1 = new CalendarDate(year1, month1, day1);
            const date2 = new CalendarDate(year2, month2, day2);

            // Assert
            if (date1.unixTimestampInSeconds !== date2.unixTimestampInSeconds) {
              expect(date1.equals(date2)).toBe(false);
            }
          },
        ),
      );
    });
  });

  describe('Test of max', () => {
    test('Throws Error for no input arguments', () => {
      expect(() => CalendarDate.max()).toThrowError(
        'CalendarDate.max Validation Error: Function max requires at least one input argument.',
      );
    });

    test('Returns input value for 1 input argument', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9800),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
          fc.array(fc.integer(200, 9800), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer(0, 11), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer(1, 31), { maxLength: 10, minLength: 10 }),
          fc.integer(1, 10),
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
              ensureValidDay(199, months[0], days[0]),
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
      expect(() => CalendarDate.min()).toThrowError(
        'CalendarDate.min Validation Error: Function min requires at least one input argument.',
      );
    });

    test('Returns input value for 1 input argument', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9800),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
          fc.array(fc.integer(200, 9800), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer(0, 11), { maxLength: 10, minLength: 10 }),
          fc.array(fc.integer(1, 31), { maxLength: 10, minLength: 10 }),
          fc.integer(1, 10),
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

  describe('Test of getFirstDayOfMonth', () => {
    test('Returns new instance with same year and month but day set to 1', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
        fc.property(fc.integer(200, 9900), fc.integer(0, 11), (year, month) => {
          // Arrange
          const baseDate = new CalendarDate(year, month, 1);

          // Act
          const firstDayDate = baseDate.getFirstDayOfMonth();

          // Assert
          expect(firstDayDate).not.toBe(baseDate);
          expect(firstDayDate.equals(baseDate)).toBe(true);
        }),
      );
    });
  });

  describe('Test of getLastDayOfMonth', () => {
    test('Returns new instance with same year and month but day set to 1', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
        fc.property(fc.integer(200, 9900), fc.integer(0, 11), (year, month) => {
          // Arrange
          const calendarDate = new CalendarDate(year, month, 1);

          // Act
          const firstOfMonth = calendarDate.isFirstDayOfMonth();

          // Assert
          expect(firstOfMonth).toEqual(true);
        }),
      );
    });

    test('Returns false if the day is not equal to 1', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(2, 31),
          (year, month, day) => {
            /// Arrange
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
        fc.property(fc.integer(200, 9900), fc.integer(0, 11), (year, month) => {
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
        }),
      );
    });

    test('Returns false if the day is not the last day of the month', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 30),
          (year, month, day) => {
            /// Arrange
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

  describe('Test of addMonths', () => {
    test('The day is always the same for the new date and the base date if the base day is 28 or lower', () => {
      fc.assert(
        fc.property(
          fc.integer(100, 9989),
          fc.integer(0, 11),
          fc.integer(1, 28),
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

    test('If the base day is greater than the max day of the new month the difference should overflow into the next month', () => {
      // Arrange
      const baseDate = new CalendarDate(2021, 0, 31);

      // Act
      const newDate = baseDate.addMonths(1);

      // Assert
      expect(newDate.month).toBe(2);
      expect(newDate.day).toBe(3);
      expect(newDate.year).toBe(2021);
    });

    test('The day should not overflow into the next month if enforceEndOfMonth is set to true', () => {
      // Arrange
      const baseDate = new CalendarDate(2021, 0, 31);

      // Act
      const newDate = baseDate.addMonths(1, true);

      // Assert
      expect(newDate.month).toBe(1);
      expect(newDate.day).toBe(28);
    });
  });

  describe('Test of addDays', () => {
    test('Returns a new valid instance with the number of days added', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9995),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
  });

  describe('Test of getDifferenceInDays', () => {
    test('Result is zero if the input date is the same as the base date', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
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
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
          fc.integer(0, 1000),
          (year, month, day, offset) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);
            const inputDate = baseDate.addDays(-offset);

            // Act
            const difference = baseDate.getDifferenceInDays(inputDate);

            // Assert
            expect(difference).toBeGreaterThanOrEqual(0);
          },
        ),
      );
    });

    test('Result is negative if the input date is in the future', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(1, 31),
          fc.integer(0, 1000),
          (year, month, day, offset) => {
            // Arrange
            day = ensureValidDay(year, month, day);
            const baseDate = new CalendarDate(year, month, day);
            const inputDate = baseDate.addDays(offset);

            // Act
            const difference = baseDate.getDifferenceInDays(inputDate);

            // Assert
            expect(difference).toBeLessThanOrEqual(0);
          },
        ),
      );
    });

    test('Result is always positive if absolute parameter is true', () => {
      fc.assert(
        fc.property(
          fc.integer(200, 9900),
          fc.integer(200, 9900),
          fc.integer(0, 11),
          fc.integer(0, 11),
          fc.integer(1, 31),
          fc.integer(1, 31),
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

  describe('Test of getMaxDayOfMonth', () => {
    test('Returns 30 for input months of 3-5-8-10', () => {
      fc.assert(
        fc.property(fc.integer(200, 9900), fc.integer(0, 3), (year, monthIndex) => {
          // Arrange
          const month = [3, 5, 8, 10][monthIndex];

          // Act
          const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, month);

          // Assert
          expect(maxDayOfMonth).toBe(30);
        }),
      );
    });

    test('Returns 31 for input months of 0-2-4-6-7-9-11', () => {
      fc.assert(
        fc.property(fc.integer(200, 9900), fc.integer(0, 6), (year, monthIndex) => {
          // Arrange
          const month = [0, 2, 4, 6, 7, 9, 11][monthIndex];

          // Act
          const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, month);

          // Assert
          expect(maxDayOfMonth).toBe(31);
        }),
      );
    });

    test('Returns 29 for a leap year and february', () => {
      fc.assert(
        fc.property(fc.integer(0, 2000), (yearInput) => {
          // Arrange
          let year = yearInput * 4;
          if (year % 400 !== 0 && year % 100 === 0) {
            year += 4;
          }

          /// Act
          const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, 1);

          // Assert
          expect(maxDayOfMonth).toBe(29);
        }),
      );
    });

    test('Returns 28 for a non leap year and february', () => {
      fc.assert(
        fc.property(fc.integer(200, 9800), (year) => {
          // Arrange
          if (year % 4 === 0) {
            year += 1;
          }

          /// Act
          const maxDayOfMonth = CalendarDate.getMaxDayOfMonth(year, 1);

          // Assert
          expect(maxDayOfMonth).toBe(28);
        }),
      );
    });
  });
});
