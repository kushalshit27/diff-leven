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
}

/**
 * Result of a diff operation on a value
 */
export interface DiffResult {
  __old?: any;
  __new?: any;
  [key: string]: any;
}
