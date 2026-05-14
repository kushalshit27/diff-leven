# Diff Skill

Compares two serializable values (objects, arrays, primitives, or strings) and produces a structured diff result describing what was added, removed, changed, or unchanged. String comparisons use the Levenshtein distance algorithm to compute edit distance and a similarity ratio. Object and array comparisons recurse into nested structures, producing a tree of child diffs.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `oldValue` | `SerializableValue` | Yes | The original value to compare. May be a string, number, boolean, null, object, or array. |
| `newValue` | `SerializableValue` | Yes | The new value to compare against. Must be the same broad type as `oldValue`, or the result will be marked `CHANGED`. |
| `options` | `DiffOptions` | No | Configuration object controlling comparison behaviour (see fields below). |
| `options.keysOnly` | `boolean` | No | Compare object structure only; treat all values as unchanged. Defaults to `false`. |
| `options.ignoreValues` | `boolean` | No | Ignore value differences; focus only on structure. Marks values unchanged with `meta.ignored = true`. Defaults to `false`. |
| `options.ignoreKeys` | `string[]` | No | Skip these keys when comparing objects. Defaults to `[]`. |
| `options.color` | `boolean` | No | Whether to use colorized output (consumer-controlled). Defaults to `true`. |
| `options.full` | `boolean` | No | Output the entire object tree, not just differences (consumer-controlled). Defaults to `false`. |
| `options.outputKeys` | `string[]` | No | Always include these keys in output for objects with differences (consumer-controlled). Defaults to `[]`. |
| `options.withSimilarity` | `boolean` | No | Show similarity info for string changes (consumer-controlled). Defaults to `false`. |
| `path` | `string[]` | No | Internal path prefix used during recursion. Should be omitted by callers. Defaults to `[]`. |

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| `type` | `DiffType` (`"added"` \| `"removed"` \| `"changed"` \| `"unchanged"`) | Classification of the change between `oldValue` and `newValue`. |
| `path` | `string[]` | Key path from the root to this node (e.g. `["user", "address", "city"]`). |
| `oldValue` | `SerializableValue` | The original value at this path. Present when `type` is `removed`, `changed`, or `unchanged`. |
| `newValue` | `SerializableValue` | The new value at this path. Present when `type` is `added`, `changed`, or `unchanged`. |
| `children` | `DiffResult[]` | Child diff results for objects and arrays when the node itself has changes. |
| `meta.levenDistance` | `number` | Levenshtein edit distance between two strings. Present only for string `CHANGED` results. |
| `meta.similarity` | `number` | Similarity ratio between 0 and 1 (1 = identical). Present only for string `CHANGED` results. |
| `meta.ignored` | `boolean` | Set to `true` when `keysOnly` or `ignoreValues` caused the value difference to be suppressed. |

## Example

```typescript
import { createDiff } from './src/diff';
import { DiffType } from './src/types';

// Compare two user objects
const oldUser = {
  name: 'Alice',
  age: 30,
  address: { city: 'London', zip: 'EC1A' },
  tags: ['admin', 'editor'],
};

const newUser = {
  name: 'Alice',
  age: 31,
  address: { city: 'Manchester', zip: 'M1 1AE' },
  tags: ['admin', 'editor', 'viewer'],
};

const result = createDiff(oldUser, newUser, { ignoreKeys: [] });

console.log(result.type);              // "changed"
console.log(result.children?.length);  // 4 (name, age, address, tags)

// Inspect a changed primitive
const ageChild = result.children?.find(c => c.path?.includes('age'));
console.log(ageChild?.type);           // "changed"
console.log(ageChild?.oldValue);       // 30
console.log(ageChild?.newValue);       // 31

// Inspect a changed string with similarity metadata
const cityChild = result.children
  ?.find(c => c.path?.includes('address'))
  ?.children?.find(c => c.path?.includes('city'));
console.log(cityChild?.type);             // "changed"
console.log(cityChild?.meta?.levenDistance); // 9
console.log(cityChild?.meta?.similarity);    // ~0.21

// Compare with keysOnly — value differences are suppressed
const structureOnly = createDiff(
  { a: 1, b: 2 },
  { a: 99, b: 2 },
  { keysOnly: true },
);
console.log(structureOnly.type); // "unchanged"
```

## Constraints

- **No external environment variables are required.** The skill is a pure TypeScript function with no I/O or network calls.
- **`leven` package dependency**: The `leven` npm package must be installed (`npm install leven`) as it provides the Levenshtein distance calculation for string comparisons.
- **Array comparison is positional only**: Arrays are compared index-by-index. There is no longest-common-subsequence (LCS) or reorder detection; a shifted element will appear as a change at every affected index.
- **Type mismatch between array and object**: If `oldValue` is an array and `newValue` is a plain object (or vice versa), the result is immediately `CHANGED` with no children.
- **`undefined` handling**: Both values being `undefined` returns `UNCHANGED`. One side being `undefined` returns `ADDED` or `REMOVED` respectively.
- **`keysOnly` and `ignoreValues` both suppress value differences**: When either option is set, primitive values are returned as `UNCHANGED` with `meta.ignored = true`, even if the values differ.
- **`options.color`, `options.full`, `options.outputKeys`, and `options.withSimilarity`** are passed through in the options object but are not consumed by `createDiff` itself — they are intended for use by a downstream formatter or renderer.
- **Input must be `SerializableValue`**: Functions, `Symbol`, `Date`, `Map`, `Set`, and other non-serializable types are not supported and will produce undefined behaviour.