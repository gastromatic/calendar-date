## [2.9.1](https://github.com/gastromatic/calendar-date/compare/v2.9.0...v2.9.1) (2025-04-15)


### Bug Fixes

* reenable constructor validation for passed strings ([#369](https://github.com/gastromatic/calendar-date/issues/369)) ([331ba4a](https://github.com/gastromatic/calendar-date/commit/331ba4a82ba397a39c6bb40a731dba0392e8e7e3))

# [2.9.0](https://github.com/gastromatic/calendar-date/compare/v2.8.0...v2.9.0) (2025-03-10)


### Features

* add new hasOverlap and hasGap CalendarDateRanges functions ([58a4c97](https://github.com/gastromatic/calendar-date/commit/58a4c974f11b9f5a04d09a2af628ca1337014994))

# [2.8.0](https://github.com/gastromatic/calendar-date/compare/v2.7.2...v2.8.0) (2025-01-28)


### Features

* add getTotalDays function to calendar date range ([d40aaf9](https://github.com/gastromatic/calendar-date/commit/d40aaf9fc04b322372c61ef429a6541fb7851372))

## [2.7.2](https://github.com/gastromatic/calendar-date/compare/v2.7.1...v2.7.2) (2024-10-23)


### Bug Fixes

* allow date below year 1000 for fromDateWithTimeZone ([67ce710](https://github.com/gastromatic/calendar-date/commit/67ce7108ab31fff70795f06f77d8670cbae0675e))

## [2.7.1](https://github.com/gastromatic/calendar-date/compare/v2.7.0...v2.7.1) (2024-10-23)


### Bug Fixes

* add caching for intl formatter ([fe98ecf](https://github.com/gastromatic/calendar-date/commit/fe98ecff04cd825eca028673f6197a093ba1703d))

# [2.7.0](https://github.com/gastromatic/calendar-date/compare/v2.6.2...v2.7.0) (2024-09-18)


### Features

* add quarter in calendar date ([#328](https://github.com/gastromatic/calendar-date/issues/328)) ([79c18e4](https://github.com/gastromatic/calendar-date/commit/79c18e431142e0f21c91e251288eb6bb8feed4e0))

## [2.6.2](https://github.com/gastromatic/calendar-date/compare/v2.6.1...v2.6.2) (2024-07-15)


### Bug Fixes

* add removed toDate method again and mark as deprecated ([#314](https://github.com/gastromatic/calendar-date/issues/314)) ([cf487e7](https://github.com/gastromatic/calendar-date/commit/cf487e777c0495f3c1ef7c3c088ce2610e30e436))

## [2.6.1](https://github.com/gastromatic/calendar-date/compare/v2.6.0...v2.6.1) (2024-07-12)


### Bug Fixes

* add better constructor validation and error logging ([#312](https://github.com/gastromatic/calendar-date/issues/312)) ([05f95b0](https://github.com/gastromatic/calendar-date/commit/05f95b0d4021ec191b2dad9dba7c7180143cb3dc))

# [2.6.0](https://github.com/gastromatic/calendar-date/compare/v2.5.0...v2.6.0) (2024-06-07)


### Features

* add toDateLocal and rename toDate to toDateUTC ([#303](https://github.com/gastromatic/calendar-date/issues/303)) ([4fcc5f1](https://github.com/gastromatic/calendar-date/commit/4fcc5f1b99da6b1d579ea94b9778e9ea19bfffb7))

# [2.5.0](https://github.com/gastromatic/calendar-date/compare/v2.4.1...v2.5.0) (2024-03-08)


### Features

* add isEqualsOrBefore and isEqualsOrAfter methods ([#286](https://github.com/gastromatic/calendar-date/issues/286)) ([8b6f286](https://github.com/gastromatic/calendar-date/commit/8b6f286b4ebda4ec8480e9a57810733a28866786))

## [2.4.1](https://github.com/gastromatic/calendar-date/compare/v2.4.0...v2.4.1) (2024-02-16)


### Bug Fixes

* calculate week of the year during runtime ([22b1f8f](https://github.com/gastromatic/calendar-date/commit/22b1f8fe55c0b4ff29ce9a42944612f312a78cbf))

# [2.4.0](https://github.com/gastromatic/calendar-date/compare/v2.3.0...v2.4.0) (2024-02-09)


### Features

* add iso week number according ISO-8601 ([acb4d09](https://github.com/gastromatic/calendar-date/commit/acb4d096d5bc5e1352568778f2ee9cc08f16d3d1))

# [2.3.0](https://github.com/gastromatic/calendar-date/compare/v2.2.1...v2.3.0) (2024-02-08)


### Bug Fixes

* update to format function to work correctly in different timezones ([15ffa0e](https://github.com/gastromatic/calendar-date/commit/15ffa0ee3c4e23a3a277199c65226ca91ccc6162))


### Features

* add additional formatting variant with Intl api ([d4c7823](https://github.com/gastromatic/calendar-date/commit/d4c7823ed326671271441448f568e96afe3eab25))

## [2.2.1](https://github.com/gastromatic/calendar-date/compare/v2.2.0...v2.2.1) (2023-10-18)


### Bug Fixes

* add well known symbol method ([#247](https://github.com/gastromatic/calendar-date/issues/247)) ([e84177b](https://github.com/gastromatic/calendar-date/commit/e84177bf115ededa48fe54f48de8c8e01a226e86))

# [2.2.0](https://github.com/gastromatic/calendar-date/compare/v2.1.0...v2.2.0) (2023-06-29)


### Features

* add isBefore and isAfter functions ([2760e66](https://github.com/gastromatic/calendar-date/commit/2760e6663001604689452d568f1282a452ff8772))

# [2.1.0](https://github.com/gastromatic/calendar-date/compare/v2.0.1...v2.1.0) (2023-05-30)


### Features

* add static sort functions ([b11bbbb](https://github.com/gastromatic/calendar-date/commit/b11bbbb96b155bb60ae19950ed104d8ac0c6096b))

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
