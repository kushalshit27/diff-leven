import { DiffEngine } from './core/DiffEngine';
import { DiffOptions, DiffResult } from './types';

// Create a single instance of the DiffEngine to reuse
const diffEngine = new DiffEngine();

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
export function diff(
  oldValue: any,
  newValue: any,
  options: DiffOptions = {},
): DiffResult {
  return diffEngine.diff(oldValue, newValue, options);
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
export function diffString(
  oldValue: any,
  newValue: any,
  options: DiffOptions = {},
): string {
  return diffEngine.diffToString(oldValue, newValue, options);
}

// Re-export types
export type { DiffOptions, DiffResult };
