import { createDiff } from './diff';
import { formatDiff } from './formatter';
import { DiffOptions, DiffResult, DiffType, SerializableValue } from './types';

/**
 * Compare two values and generate a detailed diff result object
 *
 * @param oldValue - Original value to compare from
 * @param newValue - New value to compare against
 * @param options - Configuration options for the diff
 * @returns A structured diff result object
 */
export function diff(
  oldValue: SerializableValue,
  newValue: SerializableValue,
  options: DiffOptions = {},
): DiffResult {
  return createDiff(oldValue, newValue, options);
}

/**
 * Compare two values and generate a formatted diff string
 *
 * @param oldValue - Original value to compare from
 * @param newValue - New value to compare against
 * @param options - Configuration options for the diff
 * @returns A formatted string representation of the diff
 */
export function diffString(
  oldValue: SerializableValue,
  newValue: SerializableValue,
  options: DiffOptions = {},
): string {
  const diffResult = diff(oldValue, newValue, options);
  return formatDiff(diffResult, options);
}

// Export types
export type { DiffOptions, DiffResult, SerializableValue };
export { DiffType };
