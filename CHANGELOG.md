# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2019-11-04

### Fixed

- `averageRatingByProductId` and `totalReviewsByProductId` queries now take `requireApproval` setting into account

### Added

- New review form now includes a custom `StarPicker` component instead of `NumericStepper`
- "Please log in to write review" message now includes link to login page

## [1.0.2] - 2019-10-29

### Fixed

- If 'approval required' setting is enabled, only count approved reviews in average & totals

## [1.0.1] - 2019-10-28

### Fixed

- Disabled truncation of review text in admin.

## [1.0.0] - 2019-10-25

### Added

- Initial release.