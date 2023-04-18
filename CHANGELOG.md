## [2.0.1](https://github.com/gastromatic/calendar-date/compare/v2.0.0...v2.0.1) (2023-04-18)


### Bug Fixes

* use UTC Day to get the correct weekday in the constructor ([c2d9365](https://github.com/gastromatic/calendar-date/commit/c2d93653f2c80cd851906bd988bc3c728ecb5e9b))

# [2.0.0](https://github.com/gastromatic/calendar-date/compare/v1.8.0...v2.0.0) (2022-12-14)


### Features

* add day of the week and some weekday helper functions ([b33bff3](https://github.com/gastromatic/calendar-date/commit/b33bff3eb643bb0af3a1e35947d5b02425a198a9))
* change month range from 0-11 to 1-12 ([9e18851](https://github.com/gastromatic/calendar-date/commit/9e18851e8a06a48b6adc7a274ba4eab16714bbdf))


### BREAKING CHANGES

* change month range from 0-11 to 1-12

# [1.8.0](https://github.com/gastromatic/calendar-date/compare/v1.7.0...v1.8.0) (2022-10-13)


### Features

* add static constructors with the option to pass the time zone ([ddeceb5](https://github.com/gastromatic/calendar-date/commit/ddeceb5871531c158852f6200989ab283391917f))

# [1.7.0](https://github.com/gastromatic/calendar-date/compare/v1.6.0...v1.7.0) (2022-09-14)


### Features

* add static methods to construct CalendarDate from a Date object ([9d2edc4](https://github.com/gastromatic/calendar-date/commit/9d2edc4bf1a7effc457d9acf2331701819dbb1ad))

# [1.6.0](https://github.com/gastromatic/calendar-date/compare/v1.5.0...v1.6.0) (2022-06-03)


### Features

* add difference in months method for CalendarDateRange ([e6465c8](https://github.com/gastromatic/calendar-date/commit/e6465c831d3a00914ea8c7c4a95f75a9fc70f994))

# [1.5.0](https://github.com/gastromatic/calendar-date/compare/v1.4.0...v1.5.0) (2021-09-29)


### Features

* add static constructor for nowLocal and nowUTC ([f14f93c](https://github.com/gastromatic/calendar-date/commit/f14f93c68ebf3e09a283a7385d328e4412669968))

# [1.4.0](https://github.com/gastromatic/calendar-date/compare/v1.3.0...v1.4.0) (2021-05-17)


### Features

* add toFormat function 17b9b37

# [1.3.0](https://github.com/gastromatic/calendar-date/compare/v1.2.0...v1.3.0) (2021-04-08)


### Features

* add methods to check for last and first of month 0711de4

# [1.2.0](https://github.com/gastromatic/calendar-date/compare/v1.1.2...v1.2.0) (2021-04-07)


### Features

* add static functions to determine the min or max calendarDate 30168b8

## [1.1.2](https://github.com/gastromatic/calendar-date/compare/v1.1.1...v1.1.2) (2021-03-22)


### Bug Fixes

* addMonths not returning correct year for overflow into december 564e2dd

## [1.1.1](https://github.com/gastromatic/calendar-date/compare/v1.1.0...v1.1.1) (2021-03-18)


### Bug Fixes

* add test case for wrong constructor properties 56636b2

# [1.1.0](https://github.com/gastromatic/calendar-date/compare/v1.0.0...v1.1.0) (2021-03-18)


### Features

* remove unix timestamp constructor option c410cee

# 1.0.0 (2021-03-16)


### Features

* add CalendarDate 641c7a8
* add CalendarDateRange 233c31b
