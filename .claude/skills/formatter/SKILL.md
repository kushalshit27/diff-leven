# Diff Formatter

Formats a structured diff result into a human-readable, Git-style string representation. Supports colorized terminal output, full object trees, nested objects and arrays, and optional string similarity annotations. Produces `+`/`-` prefixed lines for added and removed values, and paired `+`/`-` blocks for changed values, with ANSI color codes for green (added), red (removed), and gray (unchanged).

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| diff | `DiffResult` | Yes | The structured diff result to format, as produced by a diff engine. Must include `type`, and optionally `path`, `oldValue`, `newValue`, `children`, and `meta`. |
| options | `DiffOptions` | No | Formatting options object. All fields are optional (see table below). Defaults to `{}`. |
| options.color | `boolean` | No | Whether to include ANSI color codes in output. Defaults to `true`. |
| options.full | `boolean` | No | Output the entire object tree, not just differences. Unchanged values are shown in gray. Defaults to `false`. |
| options.withSimilarity | `boolean` | No | Append similarity percentage (e.g. `(72% similar)`) to changed string values using Levenshtein metadata. Defaults to `false`. |
| options.outputKeys | `string[]` | No | Always include these specific object keys in output even when their values are unchanged. Defaults to `[]`. |
| options.ignoreKeys | `string[]` | No | Keys to skip during comparison (passed through in diff metadata; not applied by the formatter itself). |
| options.ignoreValues | `boolean` | No | When `true`, the diff metadata marks values as ignored; formatter renders the key name only without a value. |
| options.keysOnly | `boolean` | No | Only compare object keys/structure (passed through in diff metadata; not applied by the formatter itself). |

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| (return value) | `string` | A formatted string representing the diff. Returns an empty string if the diff type is `UNCHANGED`, `full` is `false`, and there are no children. For primitive diffs, returns a single `+ value` or `- value` line, or a two-line `+ new\n- old` block for changes. For objects and arrays, returns a multi-line, indented, Git-style block. |

## Example

```typescript
import { formatDiff } from './formatter';
import { DiffType, DiffResult } from './types';

// A diff result representing an object where one field changed and one was added
const diff: DiffResult = {
  type: DiffType.CHANGED,
  oldValue: { name: 'Alice', age: 30 },
  newValue: { name: 'Alice', age: 31, city: 'Berlin' },
  children: [
    {
      type: DiffType.UNCHANGED,
      path: ['name'],
      oldValue: 'Alice',
      newValue: 'Alice',
    },
    {
      type: DiffType.CHANGED,
      path: ['age'],
      oldValue: 30,
      newValue: 31,
      meta: { similarity: 0.5 },
    },
    {
      type: DiffType.ADDED,
      path: ['city'],
      newValue: 'Berlin',
    },
  ],
};

// Format with colors disabled and similarity info enabled
const output = formatDiff(diff, {
  color: false,
  withSimilarity: true,
  outputKeys: ['name'],
});

console.log(output);
// {
//   name: 'Alice',
//   + age: 31 (50% similar)
//   - age: 30,
//   + city: 'Berlin'
// }
```

## Constraints

- No environment variables are required.
- The formatter does not compute diffs itself — it only renders a pre-built `DiffResult` tree. A separate diff engine must produce the input.
- `options.ignoreKeys` and `options.keysOnly` are recognised in the `DiffOptions` type but are not acted upon inside `formatDiff`; they are intended for the diff generation stage.
- Similarity percentage annotations (`withSimilarity`) are only rendered when `diff.meta.similarity` is present on a `CHANGED` node and both `oldValue` and `newValue` are strings (for primitive nodes), or when `meta.similarity` is set on a child node within an object or array.
- ANSI color codes are written directly to the returned string; if the output target does not support ANSI escape sequences, set `color: false`.
- Nested objects and arrays that produce only an empty `{}` or `[]` output are silently omitted from the result.