# Changelog

All notable changes to the diff-leven project will be documented in this file.

## [1.0.0] - 2025-12-24

### New

- Stabilized API surface: `diff`, `diffRaw`, and `isDiff` for formatted, raw, and boolean comparisons.
- Full option set solidified: `color`, `keysOnly`, `full`, `outputKeys`, `ignoreKeys`, `ignoreValues`, and `withSimilarity`.
- Git-style formatter established as the default output convention (`+ new` then `- old`) with optional similarity display for string changes.

### Fixed

- Array diff delegates element comparison through the core logic so `ignoreValues` and `keysOnly` work for string elements (no spurious changes reported).

## [0.3.2] - 2025-07-04

### Changed

- Refactor diff formatting and output order.

## [0.3.1] - 2025-05-31

### New

- Added CommonJS (CJS) support for better compatibility

## [0.3.0] - 2025-05-28

### New

- Added `isDiff()` method to check differences

## [0.2.0] - 2025-05-26

### New

- Added similarity info for string changes

## [0.1.2] - 2025-05-26

### Changes

- Bug fixes and improvements

## [0.1.1] - 2025-05-25

### Changes

- Bug fixes and improvements

## [0.1.0] - 2025-05-25

### New

- Initial release of the diff-leven project
