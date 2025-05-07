import { diff as diffImpl } from './diff';
import { diffToString } from './formatters';
import type { DiffOptions, DiffResult } from './types';

/**
 * Compare two values (objects, arrays, primitives) and return their differences
 *
 * @param oldValue - The original value
 * @param newValue - The new value to compare against
 * @param options - Options for controlling diff behavior
 * @returns A diff result object showing the differences
 *
 * @example
 * ```javascript
 * import { diff } from 'diff-leven';
 *
 * const result = diff({ foo: 'bar', count: 5 }, { foo: 'baz', count: 5 });
 * // result: { foo: { __old: 'bar', __new: 'baz' } }
 * ```
 */
export function diff(oldValue: any, newValue: any, options: DiffOptions = {}): DiffResult {
  return diffImpl(oldValue, newValue, options);
}

/**
 * Compare two values and return a formatted string representation of the differences
 *
 * @param oldValue - The original value
 * @param newValue - The new value to compare against
 * @param options - Options for controlling diff behavior and output
 * @returns A formatted string showing the differences
 *
 * @example
 * ```javascript
 * import { diffString } from 'diff-leven';
 *
 * const output = diffString({ foo: 'bar' }, { foo: 'baz' });
 * // Output (with colors):
 * // {
 * //   foo: - "bar"
 * //        + "baz"
 * // }
 * ```
 */
export function diffString(oldValue: any, newValue: any, options: DiffOptions = {}): string {
  const result = diffImpl(oldValue, newValue, options);
  return diffToString(oldValue, newValue, result, options);
}

// Re-export types
export type { DiffOptions, DiffResult };
