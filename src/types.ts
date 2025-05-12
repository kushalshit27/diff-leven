/**
 * Represents primitive JavaScript values that can be compared
 */
export type DiffPrimitive = string | number | boolean | null | undefined;

// Use interface declarations to allow recursive types
export type DiffArray = Array<DiffValue>;
export interface DiffObject {
  [key: string]: DiffValue;
}

/**
 * Represents any JavaScript value that can be compared
 */
export type DiffValue = DiffPrimitive | DiffArray | DiffObject;

/**
 * Options for controlling diff behavior and output
 */
export interface DiffOptions {
  /**
   * Whether to colorize the output (default: true)
   */
  color?: boolean;

  /**
   * Compare only the object structure (keys), ignoring the values (default: false)
   */
  keysOnly?: boolean;

  /**
   * Output the entire object tree, not just differences (default: false)
   */
  full?: boolean;

  /**
   * Always output these keys for objects with differences
   */
  outputKeys?: string[];

  /**
   * Skip specified keys when comparing objects
   */
  ignoreKeys?: string[];

  /**
   * Ignore differences in values, focus only on structure (default: false)
   */
  ignoreValues?: boolean;
}

/**
 * Represents a diff result showing the old and new values
 */
export interface DiffChange {
  __old?: DiffValue;
  __new?: DiffValue;
}

/**
 * Type guard to check if a value is a DiffChange
 */
export function isDiffChange(value: unknown): value is DiffChange {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('__old' in value || '__new' in value)
  );
}

/**
 * Type guard to check if a value is a Record<string, DiffResult>
 */
export function isRecordOfDiffResults(
  value: unknown,
): value is Record<string, DiffResult> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !isDiffChange(value)
  );
}

/**
 * Basic result types that can be returned from a diff operation
 */
export type BasicDiffResult = DiffValue | DiffChange;

/**
 * Result of a diff operation on a value
 * Can be a simple value, a DiffChange object, or a complex object with nested diff results
 */
export type DiffResult =
  | BasicDiffResult
  | { [key: string]: DiffResult }
  | Array<DiffResult>;
