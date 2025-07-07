# diff-leven

> Git-like diff between two strings or objects, powered by the Levenshtein distance algorithm

[![npm version](https://img.shields.io/npm/v/diff-leven)](https://www.npmjs.com/package/diff-leven)
[![npm](https://img.shields.io/npm/dm/diff-leven.svg)](https://www.npmjs.com/package/diff-leven)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/diff-leven/badge?style=rounded)](https://www.jsdelivr.com/package/npm/diff-leven)
![License](https://img.shields.io/npm/l/diff-leven.svg)

**Try now:** [link](https://kushalshit27.github.io/diff-leven/)

---

## ✨ Features

- **Advanced Diff Generation**: Uses the Levenshtein distance algorithm for meaningful diffs
- **Multiple Data Type Support**:
  - Objects (including nested structures)
  - Arrays (smart matching by content similarity)
  - Strings (character-level differences)
  - Numbers, Booleans, and any serializable value
- **Rich Output Options**:

  - Git-style colorized output diff format with clear additions/removals

- **Flexible Configuration**:
  - `color`: Toggle color output (default: `true`)
  - `keysOnly`: Compare only object structure/keys (default: `false`)
  - `full`: Output the entire object tree, not just differences (default: `false`)
  - `outputKeys`: Always include specified keys in output for objects with differences
  - `ignoreKeys`: Skip specified keys when comparing objects
  - `ignoreValues`: Ignore value differences, focus on structure

---

## 🚀 Quick Start

### 1. Install

```bash
npm install diff-leven
```

### 2. Usage

```js
const { diff } = require('diff-leven');

console.log(diff({ foo: 'bar' }, { foo: 'baz' }));
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//  }
```

---

## 🛠️ API Reference

### `diff(a, b, options?)`

Compare two values (strings, objects, arrays, etc.) and return a formatted diff string.

#### **Parameters**

- `a`, `b`: Anything serializable (object, array, string, number, etc.)
- `options` _(optional object)_:
  - `color` _(boolean)_: Use colors in output (default: `true`)
  - `keysOnly` _(boolean)_: Only compare object keys (default: `false`)
  - `full` _(boolean)_: Output the entire JSON tree (default: `false`)
  - `outputKeys` _(string[])_: Always include these keys in output (default: `[]`)
  - `ignoreKeys` _(string[])_: Ignore these keys when comparing (default: `[]`)
  - `ignoreValues` _(boolean)_: Ignore value differences (default: `false`)

#### **Returns**

- A string representing the diff between `a` and `b`.

### `diffRaw(a, b, options?)`

Compare two values (strings, objects, arrays, etc.) and return a structured diff result object.

#### **Parameters**

- `a`, `b`: Anything serializable (object, array, string, number, etc.)
- `options` _(optional object)_:
  - `color` _(boolean)_: Use colors in output (default: `true`)
  - `keysOnly` _(boolean)_: Only compare object keys (default: `false`)
  - `full` _(boolean)_: Output the entire JSON tree (default: `false`)
  - `outputKeys` _(string[])_: Always include these keys in output (default: `[]`)
  - `ignoreKeys` _(string[])_: Ignore these keys when comparing (default: `[]`)
  - `ignoreValues` _(boolean)_: Ignore value differences (default: `false`)

#### **Returns**

- A structured object representing the diff between `a` and `b`.

### `isDiff(a, b, options?)`

Check if two values (strings, objects, arrays, etc.) are different and return a boolean result.

#### **Parameters**

- `a`, `b`: Anything serializable (object, array, string, number, etc.)
- `options` _(optional object)_:
  - `keysOnly` _(boolean)_: Only compare object keys (default: `false`)
  - `ignoreKeys` _(string[])_: Ignore these keys when comparing (default: `[]`)
  - `ignoreValues` _(boolean)_: Ignore value differences (default: `false`)

#### **Returns**

- A boolean indicating if the values are different (`true` = different, `false` = identical).

#### **Examples**

```js
const { diff, diffRaw, isDiff } = require('diff-leven');

// Basic diff (string output)
console.log(diff({ foo: 'bar' }, { foo: 'baz' }));
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//  }

// Raw diff object
const rawDiff = diffRaw({ foo: 'bar' }, { foo: 'baz' });
console.log(JSON.stringify(rawDiff, null, 2));
// Output:
// {
//   "type": "changed",
//   "path": [],
//   "oldValue": { "foo": "bar" },
//   "newValue": { "foo": "baz" },
//   "children": [
//     {
//       "type": "changed",
//       "path": ["foo"],
//       "oldValue": "bar",
//       "newValue": "baz"
//     }
//   ]
// }

// Boolean diff check
console.log(isDiff({ foo: 'bar' }, { foo: 'baz' }));
// Output: true

console.log(isDiff({ foo: 'bar' }, { foo: 'bar' }));
// Output: false

// With options
console.log(
  isDiff(
    { foo: 'bar', timestamp: 123 },
    { foo: 'bar', timestamp: 456 },
    { ignoreKeys: ['timestamp'] },
  ),
);
// Output: false (identical when ignoring timestamp)

// No colors
console.log(diff({ foo: 'bar' }, { foo: 'baz' }, { color: false }));
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//  }

// Full output
console.log(diff({ foo: 'bar', b: 3 }, { foo: 'baz', b: 3 }, { full: true }));
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//    b: 3
//  }

// Ignore keys
console.log(
  diff({ foo: 'bar', b: 3 }, { foo: 'baz', b: 3 }, { ignoreKeys: ['b'] }),
);
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//  }

// Ignore values
console.log(
  diff({ foo: 'bar', b: 3 }, { foo: 'baz', b: 3 }, { ignoreValues: true }),
);
// Output showing structural differences only

// Show similarity info for string changes
console.log(
  diff('hello world', 'hello there', { color: true, withSimilarity: true }),
);
// Output:
// - 'hello world'
// + 'hello there' (73% similar)

// Output specific keys
console.log(
  diff({ foo: 'bar', b: 3 }, { foo: 'baz', b: 3 }, { outputKeys: ['foo'] }),
);
// Output:
//  {
// -  foo: "bar"
// +  foo: "baz"
//  }

// Combine options
console.log(
  diff(
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
```

---

## ⚙️ Options Matrix

| Option           | Type     | Default | Description                                  |
| ---------------- | -------- | ------- | -------------------------------------------- |
| `color`          | boolean  | true    | Use colorized output                         |
| `keysOnly`       | boolean  | false   | Only compare object keys                     |
| `full`           | boolean  | false   | Output the entire object tree                |
| `outputKeys`     | string[] | []      | Always include these keys in output          |
| `ignoreKeys`     | string[] | []      | Ignore these keys when comparing             |
| `ignoreValues`   | boolean  | false   | Ignore value differences, focus on structure |
| `withSimilarity` | boolean  | false   | Show similarity info for string changes      |

---

## 📦 Examples

See [`examples/basic.js`](examples/basic.js) for more usage patterns.

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## 📄 License

MIT © [kushalshit27](LICENSE)
