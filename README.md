# calendar-date

A calendar date is a date without time information, e.g. "2020-01-01".
This library provides an immutable object to represent and work with a calendar date.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/calendar-date.svg)](https://badge.fury.io/js/calendar-date)
[![Coverage Status](https://coveralls.io/repos/github/gastromatic/calendar-date/badge.svg?branch=main)](https://coveralls.io/github/gastromatic/calendar-date?branch=main)

## Why another date library?

There are a lot of date libraries in the javascript world, but there is currently no adequate support for representing a calendar date.
Most SQL Databases like MySQL and PostgreSQL have a datatype for representing a date without time information.

Using the built-in date object for a calendar date poses a number of disadvantages:
- If you are using typescript you can not tell if the object is representing a timestamp, or a calendar date by looking at the type definition.
- If you want to compare two date objects it is harder to do it without knowing if the time and timezone information are the same.
- Overhead by including time and timezone information in the representation.
- Error prone when working with different timezones and converting from and to Strings.
  For example `new Date(2020, 0, 1)` and `new Date('2020-01-01')` return different Date objects depending on your local timezone.
  If you call `toISOString()` on both date objects based on a timezone of UTC+1 it would return `2019-12-31T23:00:00.000Z` for the first and `2020-01-01T00:00:00.000Z` for the second.
  
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

## Migration from v1 to v2
If you want to upgrade from v1 to v2 of calendar-date you need to check if you access the read only month property on the calendar date object or use the number constructor anywhere and change the code according to the change (Range of month changed from 0-11 to 1-12). All other functions and properties work the same as before.

## Documentation

### CalendarDate

You can construct a CalendarDate from a String `YYYY-MM-DD` according to ISO 8601 or the year, month and day values.
The following constructor calls return the same calendar date.

```typescript
new CalendarDate('2020-01-01');
new CalendarDate(2020, 1, 1);
```

You can also get the current UTC CalendarDate, the current local CalendarDate based on the timezone of your local environment or a CalendarDate for a specific time zone with the static methods `nowUTC`, `nowLocal` and `nowTimeZone`.

```typescript
CalendarDate.nowUTC();
CalendarDate.nowLocal();
CalendarDate.nowTimeZone('Europe/Berlin');
```

If you want to construct a CalendarDate from an existing Date object instead of the current Time you can use the static methods `fromDateUTC`, `fromDateLocal` and `fromDateTimeZone`.
```typescript
const date = new Date();
CalendarDate.fromDateUTC(date);
CalendarDate.fromDateLocal(date);
CalendarDate.fromDateTimeZone(date, 'Europe/Berlin');
```

The year, month, day and unix timestamp can be accessed as read-only properties on the object.
Since version 2 of calendar-date the month value is now in the range of 1 to 12 and not of 0 to 11 anymore.

To compare to CalendarDate objects you can use the `equals`, `isBefore`, `isAfter`, `isBeforeOrEqual` and `isAfterOrEqual` 
function or`>=`, `<=`, `>` and `<` operators.
The comparison works based on the unix timestamp.

```typescript
const date1 = new CalendarDate('2020-01-01');
const date2 = new CalendarDate('2020-01-01');
const date3 = new CalendarDate('2020-02-02');

date1.equals(date2)   // true
date1 === date2       // false
date1.equals(date3)   // false
date1.isBefore(date3) // true
date1.isAfter(date3)  // false
date1.isBeforeOrEqual(date2) // true
date1.isAfterOrEqual(date2)  // false
date1 >= date2        // true
date1 > date2         // false
date1 >= date3        // false
date1 <= date3        // true
```

#### addMonths, addDays
Returns a new CalendarDate with the specified amount of months or days added.

```typescript
new CalendarDate('2020-01-01').addMonths(3);    // 2020-03-01
new CalendarDate('2020-01-01').addDays(15);     // 2020-01-16
```

#### getFirstDayOfMonth, getLastDayOfMonth
Returns a new CalendarDate with the first or last day of the month.

```typescript
new CalendarDate('2020-01-15').getFirstDayOfMonth();    // 2020-01-01
new CalendarDate('2020-01-15').getLastDayOfMonth();     // 2020-01-31
```

#### isFirstDayOfMonth, isLastDayOfMonth
Returns true if the CalendarDate is the first day of the month / last day of the month;

```typescript
new CalendarDate('2020-01-15').isFirstDayOfMonth();   // false
new CalendarDate('2020-01-01').isFirstDayOfMonth();   // true
new CalendarDate('2020-01-30').isLastDayOfMonth();    // false
new CalendarDate('2020-01-31').isLastDayOfMonth();    // true
```

#### getDifferenceInDays
Returns the difference in days between to CalendarDate objects.
It will subtract the input date from the base date. If you supply the optional `absolute` parameter it will always return a positive value.

```typescript
const date1 = new CalendarDate('2020-01-01');
const date2 = new CalendarDate('2020-02-01');
date1.getDifferenceInDays(date2);       // -31
date1.getDifferenceInDays(date2, true); // 31
```

#### max, min
Returns the max/min CalendarDate for an array of CalendarDates.

```typescript
const date1 = new CalendarDate('2020-01-01');
const date2 = new CalendarDate('2020-06-10');
const date3 = new CalendarDate('2021-03-15');
const maxDate = CalendarDate.max(date1, date2, date3); // 2021-03-15
const minDate = CalendarDate.min(date1, date2, date3); // 2020-01-01
```

#### sortAscending, sortDescending
Returns a sorted copy of an array of CalendarDates.

```typescript
const sortedArrayAscending = CalendarDate.sortAscending([new CalendarDate('2020-01-01'), new CalendarDate('2020-06-10'), new CalendarDate('2021-03-15')]);
const sortedArrayDescending = CalendarDate.sortDescending([new CalendarDate('2020-01-01'), new CalendarDate('2020-06-10'), new CalendarDate('2021-03-15')]);
```

#### toFormat
Returns the formatted string based on a provided pattern.

```typescript
const date = new CalendarDate('2020-06-01');
date.toFormat('dd.MM.yy');     // 01.06.20
date.toFormat('d-M-yy');       // 1.6.20
date.toFormat('yyyy/dd/MM');   // 2020/01/06

```

You can also supply a locale and options object from the [Intl DateTimeFormat Api](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
    
```typescript
const date = new CalendarDate('2020-06-01');
date.toFormat('en', { year: 'numeric', month: 'numeric', day: 'numeric' });     // 6/1/2020
date.toFormat('en', { weekday: 'long', month: 'short', day: 'numeric' });     // Monday, Jun 1
```

#### WeekOfYear (ISO-8601)
You can access the week of year according to ISO 8601 as a read only property on the calendar date object.
```typescript
new CalendarDate('2023-01-01').week;    // 52 (of year 2022)
new CalendarDate('2023-01-01').week;    // 1 (of year 2023)
```

#### DayOfTheWeek
You can access the weekday according to ISO 8601 as a read only property on the calendar date object. The values are in the range from 1 to 7 starting from Monday.
```typescript
new CalendarDate('2020-01-13').weekday;    // 1 (Monday)
new CalendarDate('2020-01-19').weekday;    // 7 (Sunday)
```

#### getFirstDayOfWeek, getLastDayOfWeek
Returns a new CalendarDate with the first or last day of the week.

```typescript
new CalendarDate('2020-01-15').getFirstDayOfWeek();    // 2020-01-13 (Monday)
new CalendarDate('2020-01-15').getLastDayOfWeek();     // 2020-01-19 (Friday)
```

#### isFirstDayOfWeek, isLastDayOfWeek
Returns true if the CalendarDate is the first day of the week / last day of the week;

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

You can also parse a CalendarDateRange from a String representation with the format `YYYY-MM-DD/YYYY-MM-DD`:
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

```typescript
const date1 = new CalendarDate('2020-01-01');
const date2 = new CalendarDate('2020-02-01');
new CalendarDateRange(date1, date2).getDifferenceInDays();  // 31
```

#### getDifferenceInMonths
Returns the difference in months between start and end of the CalendarDateRange as an integer, ignoring the day values.

```typescript
const date1 = new CalendarDate('2020-05-15');
const date2 = new CalendarDate('2022-02-01');
new CalendarDateRange(date1, date2).getDifferenceInMonths();  // 21
```

## License

This project is licensed under the [MIT License](LICENSE).
