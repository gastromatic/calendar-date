# calendar-date

A calendar date is a date without time information, e.g. "2020-01-01".
This library provides an immutable object to represent and work with a calendar date.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Why another date library?

There are a lot of date libraries in the javascript world, but there is currently no adequate support for representing a calendar date.
Most SQL Databases like MySQL and PostgreSQL have a datatype for representing a date without time information.

Using the built-in date object for a calendar date poses a number of disadvantages:
- If you are using typescript you can not tell if the object is representing a timestamp or a calendar date by looking at the type definition.
- If you want to compare two date objects it's harder to do it without knowing if the time and timezone information are the same.
- Overhead by including time and timezone information in the representation.
- Error prone when working with different timezones and converting from and to Strings.
  For example `new Date(2020, 0, 1)` and `new Date('2020-01-01')` return date objects with a difference of one hour.
  If you call `toISOString()` on date objects it would return `2019-12-31T23:00:00.000Z` for the first and `2020-01-01T00:00:00.000Z` for the second.
  
## Features

- CalendarDate and CalendarDateRange
- Immutable API
- Written completely in typescript
- No external dependencies
- Tiny package size

## Getting Started

Install with yarn or npm:

```sh
yarn add calendar-date
```

or

```sh
npm install calendar-date
```

## Documentation

### CalendarDate

You can construct a CalendarDate from a String `YYYY-MM-DD` according to ISO 8601, a unix timestamp in seconds or the year, month and date values.
The following constructor calls return the same calendar date.

```typescript
new CalendarDate('2020-01-01');
new CalendarDate(1577833200);
new CalendarDate(2020, 0, 1);
```

The year, month, day and unix timestamp can be accessed as read-only properties on the object.

To compare to CalendarDate objects you can use the `equals` function or `>=` and `<=` operators.
The comparison works based on the unix timestamp.

```typescript
const date1 = new CalendarDate('2020-01-01');
const date2 = new CalendarDate('2020-01-01');
const date3 = new CalendarDate('2020-02-02');

date1.equals(date2) // true
date1.equals(date3) // false
date1 >= date2      // true
date1 >= date3      // false
date1 <= date3      // true
```
Utility Methods:
#### addMonths, addDays
Returns a new CalendarDate with the specified amount of months or days added.

#### getLastDayOfMonth, getFirstDayOfMonth
Returns a new CalendarDate with the first or last day of the month.

#### getDifferenceInDays
Returns the difference in days between to CalendarDate objects.

### CalendarDateRange
You need two CalendarDate objects to construct a new CalendarDateRange.
The first CalendarDate needs to be before or equal to the second CalendarDate.
If you set the optional `autoArrange` to true the constructor will determine the correct order of the passed CalendarDates.

```typescript
const start = new CalendarDate('2020-01-01');
const end = new CalendarDate('2020-12-31');
new CalendarDateRange(start, end);

// OR

new CalendarDateRange(end, start, true);

// This will throw an error
new CalendarDateRange(end, start)
```

You can also parse a CalendarDateRange from an String representation with the format `YYYY-MM-DD/YYYY-MM-DD`:
```typescript
CalendarDateRange.parse('2020-01-01/2020-12-31');
```
Start and end CalendarDates can be accessed as read-only properties on the object.

To compare a CalendarDateRange you can use the `equals` method.
It will return true if the start and end date represent the same CalendarDate for both CalendarDateRange objects.

#### includes
Can be used to check if a CalendarDateRange or a CalendarDate is included in the Interval defined by the base CalendarDateRange.
By default, start and end CalendarDates are included in the calculation, but you can omit them with the options parameter:

```typescript
const date1 = new CalendarDate('2020-01-01');
const date2 = new CalendarDate('2020-02-01');
const date3 = new CalendarDate('2020-03-01');

const dateRange = new CalendarDateRange(date1, date3);

dateRange.includes(date1);                          // true
dateRange.includes(date1, { excludeStart: true});   // false
dateRange.includes(date2);                          // true
dateRange.includes(date2, { excludeEnd: true});     // false
dateRange.includes(date3);                          // true
```

#### getDifferenceInDays
Returns the difference in days between start and end of the CalendarDateRange.

## License

This project is licensed under the [MIT License](LICENSE).
