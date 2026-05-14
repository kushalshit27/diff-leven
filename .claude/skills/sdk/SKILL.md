# SDK Diff Skill

A utility skill for comparing two serializable values and generating structured or formatted diff results. It supports deep comparison of objects, arrays, and primitives, with options for colorized output, key filtering, similarity metrics, and more.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| oldValue | `SerializableValue` | Yes | The original value to compare from. Accepts strings, numbers, booleans, null, undefined, plain objects, or arrays. |
| newValue | `SerializableValue` | Yes | The new value to compare against. Must be the same type family as `oldValue`. |
| options.color | `boolean` | No | Whether to use colorized output in formatted strings. Defaults to `true`. |
| options.keysOnly | `boolean` | No | Only compare object keys/structure and ignore values. Defaults to `false`. |
| options.full | `boolean` | No | Output the entire object tree, not just the differences. Defaults to `false`. |
| options.outputKeys | `string[]` | No | Always include these keys in output for objects that contain differences. Defaults to `[]`. |
| options.ignoreKeys | `string[]` | No | Skip these keys entirely when comparing objects. Defaults to `[]`. |
| options.ignoreValues | `boolean` | No | Ignore value differences and focus only on structural changes. Defaults to `false`. |
| options.withSimilarity | `boolean` | No | Show Levenshtein-based similarity info for string changes. Defaults to `false`. |

## Outputs

### `diff()` → `string`

| Field | Type | Description |
|-------|------|-------------|
| *(return value)* | `string` | A formatted string representation of the diff, optionally colorized. |

### `diffRaw()` → `DiffResult`

| Field | Type | Description |
|-------|------|-------------|
| type | `DiffType` | The kind of change: `"added"`, `"removed"`, `"changed"`, or `"unchanged"`. |
| path | `string[]` | Optional path array indicating the location of the change within a nested structure. |
| oldValue | `SerializableValue` | The original value at this node, if applicable. |
| newValue | `SerializableValue` | The new value at this node, if applicable. |
| children | `DiffResult[]` | Nested diff results for object or array children. |
| meta.levenDistance | `number` | Levenshtein distance between two strings (present when `withSimilarity` is `true`). |
| meta.similarity | `number` | Similarity ratio between 0 and 1, where 1 means identical (present when `withSimilarity` is `true`). |

### `isDiff()` → `boolean`

| Field | Type | Description |
|-------|------|-------------|
| *(return value)* | `boolean` | `true` if the two values differ in any way; `false` if they are identical. |

## Example

```typescript
import { diff, diffRaw, isDiff, DiffType } from './src/index';

const oldValue = { name: 'Alice', age: 30, role: 'admin' };
const newValue = { name: 'Alice', age: 31, role: 'user' };

// Get a formatted diff string (colorized by default)
const formatted = diff(oldValue, newValue, { color: false });
console.log(formatted);

// Get a structured diff result for programmatic use
const result = diffRaw(oldValue, newValue, { full: true, withSimilarity: true });
console.log(result.type);         // "changed"
console.log(result.children);     // array of per-key DiffResult entries

// Quickly check if two values differ
const changed = isDiff(oldValue, newValue);
console.log(changed); // true

// Ignore specific keys during comparison
const sameIgnoringAge = isDiff(oldValue, newValue, { ignoreKeys: ['age', 'role'] });
console.log(sameIgnoringAge); // false
```

## Constraints

- **No environment variables** are required to use this skill.
- `SerializableValue` inputs must be JSON-serializable; class instances, functions, `Symbol`, `Map`, `Set`, and other non-plain types are not supported.
- `withSimilarity` and Levenshtein metrics apply only to string value comparisons; the `meta` field will be absent for non-string diffs.
- `keysOnly` and `ignoreValues` options both suppress value-level differences but do so in slightly different ways; they should not be assumed to be interchangeable.
- Colorized output (the `color` option) affects only the `diff()` formatted string return value; `diffRaw()` and `isDiff()` are unaffected by it.
- The `outputKeys` option only takes effect for objects that already contain at least one detected difference.