# diff-leven

Git like diff between two strings, using the Levenshtein distance algorithm

[![npm version](https://badge.fury.io/js/diff-leven.svg)](https://badge.fury.io/js/diff-leven)
[![Build Status](https://travis-ci.org/niklasvh/diff-leven.svg?branch=master)](https://travis-ci.org/niklasvh/diff-leven)
[![Coverage Status](https://coveralls.io/repos/github/niklasvh/diff-leven/badge.svg?branch=master)](https://coveralls.io/github/niklasvh/diff-leven?branch=master)
[![npm](https://img.shields.io/npm/dm/diff-leven.svg)](https://www.npmjs.com/package/diff-leven)
[![License](https://img.shields.io/npm/l/diff-leven.svg)]

## Features

- **Advanced Diff Generation**: Uses the Levenshtein distance algorithm to produce meaningful diffs between values
- **Multiple Data Type Support**:
  - Objects (including nested structures)
  - Arrays (with smart matching based on content similarity)
  - Strings (with character-level differences)
  - Numbers
  - Booleans
  - Any value that can be serialized to a string
- **Rich Output Options**:
  - Terminal-friendly colorized output (can be disabled)
  - Git-style diff format with additions and removals clearly marked
- **Flexible Configuration**:
  - `color`: Toggle colorized output (default: true)
  - `keysOnly`: Compare only object structure/keys, ignoring values (default: false)
  - `full`: Output the entire object tree, not just differences (default: false)
  - `outputKeys`: Always include specified keys in output for objects with differences
  - `ignoreKeys`: Skip specified keys when comparing objects
  - `ignoreValues`: Ignore differences in values, focus only on structure

## Exported Functions

- `diff`: compares two strings or objects and returns a string with the diff

### diff

- input: two anything that can be converted to a string
- options: an object with the following properties:
  - color: a boolean that indicates whether to use colors in the output (default: true)
  - keysOnly: a boolean that indicates whether to only compare the keys of the objects (default: false)
  - full: a boolean that indicates whether to output the entire json tree, not just the deltas (default: false)
  - outputKeys: an array of keys to always output for an object that has differences (default: [])
  - ignoreKeys: an array of keys to ignore when comparing objects (default: [])
  - ignoreValues: a boolean that indicates whether to ignore the values of the objects (default: false)
- output: a string with the diff between the two strings or objects
  Example:

  ```javascript
  var jsonDiff = require('diff-leven');
  console.log(jsonDiff.diff({ foo: 'bar' }, { foo: 'baz' }));
  // Output:
  //  {
  // -  foo: "bar"
  // +  foo: "baz"
  //  }

  // As above, but without console colors

  console.log(jsonDiff.diff({ foo: 'bar' }, { foo: 'baz' }, { color: false }));
  // Output:
  //  {
  // -  foo: "bar"
  // +  foo: "baz"
  //  }

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

  // Passing in the "outputKeys" option:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { outputKeys: ['foo'] },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }

  // Passing in the "ignoreKeys" option:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { ignoreKeys: ['b'] },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' } }

  // Passing in the "ignoreValues" option:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { ignoreValues: true },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }

  // Passing in the "keysOnly" option:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { keysOnly: true },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }

  // Passing in the "ignoreKeys" and "ignoreValues" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { ignoreKeys: ['b'], ignoreValues: true },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' } }

  // Passing in the "keysOnly" and "ignoreValues" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { keysOnly: true, ignoreValues: true },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }

  // Passing in the "keysOnly" and "ignoreKeys" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { keysOnly: true, ignoreKeys: ['b'] },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }

  // Passing in the "keysOnly", "ignoreKeys" and "ignoreValues" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      { keysOnly: true, ignoreKeys: ['b'], ignoreValues: true },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' } }

  // Passing in the "keysOnly", "ignoreKeys", "ignoreValues" and "outputKeys" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      {
        keysOnly: true,
        ignoreKeys: ['b'],
        ignoreValues: true,
        outputKeys: ['foo'],
      },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' } }

  // Passing in the "keysOnly", "ignoreKeys", "ignoreValues", "outputKeys" and "full" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      {
        keysOnly: true,
        ignoreKeys: ['b'],
        ignoreValues: true,
        outputKeys: ['foo'],
        full: true,
      },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }

  // Passing in the "keysOnly", "ignoreKeys", "ignoreValues", "outputKeys", "full" and "color" options:

  console.log(
    jsonDiff.diff(
      { foo: 'bar', b: 3 },
      { foo: 'baz', b: 3 },
      {
        keysOnly: true,
        ignoreKeys: ['b'],
        ignoreValues: true,
        outputKeys: ['foo'],
        full: true,
        color: false,
      },
    ),
  );
  // Output:
  // { foo: { __old: 'bar', __new: 'baz' }, b: 3 }
  ```

Insprired by

- [leven](https://github.com/sindresorhus/leven)
- [json-diff](https://github.com/andreyvit/json-diff)
