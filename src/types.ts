/**
 * Options for diff generation
 */
export interface DiffOptions {
  /**
   * Whether to use colorized output
   * @default true
   */
  color?: boolean;

  /**
   * Only compare object keys/structure (ignore values)
   * @default false
   */
  keysOnly?: boolean;

  /**
   * Output the entire object tree, not just differences
   * @default false
   */
  full?: boolean;

  /**
   * Always include these keys in output for objects with differences
   * @default []
   */
  outputKeys?: string[];

  /**
   * Skip these keys when comparing objects
   * @default []
   */
  ignoreKeys?: string[];

  /**
   * Ignore value differences, focus only on structure
   * @default false
   */
  ignoreValues?: boolean;
}

/**
 * Enum for diff change types
 */
export enum DiffType {
  ADDED = 'added',
  REMOVED = 'removed',
  CHANGED = 'changed',
  UNCHANGED = 'unchanged',
}

/**
 * Represents a change between two values
 */
export interface DiffResult {
  type: DiffType;
  path?: string[];
  oldValue?: any;
  newValue?: any;
  children?: DiffResult[];
  /**
   * Additional metadata about the diff, such as Levenshtein distance metrics
   */
  meta?: {
    /** Levenshtein distance between strings */
    levenDistance?: number;
    /** Similarity ratio (0-1) where 1 means identical */
    similarity?: number;
    /** Any other metadata properties */
    [key: string]: any;
  };
}

/**
 * Type for handling any serializable value
 */
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: SerializableValue }
  | SerializableValue[];
