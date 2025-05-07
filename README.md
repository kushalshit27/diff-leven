# diff-leven

Git like diff between two strings, using the Levenshtein distance algorithm

[![npm version](https://badge.fury.io/js/diff-leven.svg)](https://badge.fury.io/js/diff-leven)
[![Build Status](https://travis-ci.org/niklasvh/diff-leven.svg?branch=master)](https://travis-ci.org/niklasvh/diff-leven)
[![Coverage Status](https://coveralls.io/repos/github/niklasvh/diff-leven/badge.svg?branch=master)](https://coveralls.io/github/niklasvh/diff-leven?branch=master)
[![npm](https://img.shields.io/npm/dm/diff-leven.svg)](https://www.npmjs.com/package/diff-leven)
[![License](https://img.shields.io/npm/l/diff-leven.svg)]

Features:

- Levenshtein distance algorithm (use npm packege leven for a pure distance algorithm: https://github.com/sindresorhus/leven)
- colorized, diff-like output
- fuzzy matching of modified array elements (when array elements are object hierarchies)
- "keysOnly" option to compare only the json structure (keys), ignoring the values
- -"full" option to output the entire json tree, not just the deltas
- "outputKeys" option to always output the given keys for an object that has differences

Example

```javascript
var jsonDiff = require('diff-leven');

console.log(jsonDiff.diffString({ foo: 'bar' }, { foo: 'baz' }));
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//  }

// As above, but without console colors
console.log(
  jsonDiff.diffString({ foo: 'bar' }, { foo: 'baz' }, { color: false }),
);

// Raw output:
console.log(jsonDiff.diff({ foo: 'bar', b: 3 }, { foo: 'baz', b: 3 }));
// Output:
// { foo: { __old: 'bar', __new: 'baz' } }

// Passing in the "full" option:
console.log(
  jsonDiff.diff({ foo: 'bar', b: 3 }, { foo: 'baz', b: 3 }, { full: true }),
);
// Output:
// { foo: { __old: 'bar', __new: 'baz' }, b: 3 }
```
