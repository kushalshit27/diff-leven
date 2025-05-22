import leven from 'leven';
import { DiffOptions, DiffResult, DiffType, SerializableValue } from './types';

/**
 * Compares two values (objects, arrays, strings, etc.) and creates a diff result
 * Uses the Levenshtein distance algorithm for string comparison
 *
 * @param oldValue - The original value to compare
 * @param newValue - The new value to compare against
 * @param options - Configuration options
 * @param path - Current path in the object tree (used internally for recursion)
 * @returns A diff result object
 */
export function createDiff(
  oldValue: SerializableValue,
  newValue: SerializableValue,
  options: DiffOptions = {},
  path: string[] = [],
): DiffResult {
  const { keysOnly = false, ignoreValues = false } = options;

  // Handle case where one or both values are undefined
  if (oldValue === undefined && newValue === undefined) {
    return { type: DiffType.UNCHANGED };
  }
  if (oldValue === undefined) {
    return { type: DiffType.ADDED, path, newValue };
  }
  if (newValue === undefined) {
    return { type: DiffType.REMOVED, path, oldValue };
  }

  // Handle primitive values
  if (
    typeof oldValue !== 'object' ||
    typeof newValue !== 'object' ||
    oldValue === null ||
    newValue === null
  ) {
    if (keysOnly || ignoreValues) {
      // For ignoreValues, retain the path information for better formatting
      return {
        type: DiffType.UNCHANGED,
        path,
        oldValue,
        newValue,
        meta: { ignored: true },
      };
    }
    if (oldValue === newValue) {
      return { type: DiffType.UNCHANGED, path, oldValue, newValue };
    }

    // Special handling for strings - use Levenshtein distance
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      const distance = leven(oldValue, newValue);
      const maxLength = Math.max(oldValue.length, newValue.length);
      const similarityRatio = maxLength > 0 ? 1 - distance / maxLength : 1;

      return {
        type: DiffType.CHANGED,
        path,
        oldValue,
        newValue,
        meta: {
          levenDistance: distance,
          similarity: similarityRatio,
        },
      };
    }

    return { type: DiffType.CHANGED, path, oldValue, newValue };
  }

  // Handle arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return compareArrays(oldValue, newValue, options, path);
  }

  // Handle objects
  return compareObjects(
    oldValue as Record<string, any>,
    newValue as Record<string, any>,
    options,
    path,
  );
}

/**
 * Compare two objects and generate a diff
 */
function compareObjects(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  options: DiffOptions,
  path: string[],
): DiffResult {
  const { ignoreKeys = [] } = options;

  const allKeys = new Set([
    ...Object.keys(oldObj).filter((key) => !ignoreKeys.includes(key)),
    ...Object.keys(newObj).filter((key) => !ignoreKeys.includes(key)),
  ]);

  const children: DiffResult[] = [];
  let hasChanges = false;

  for (const key of allKeys) {
    const childPath = [...path, key];
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    const childDiff = createDiff(oldValue, newValue, options, childPath);

    if (childDiff.type !== DiffType.UNCHANGED) {
      hasChanges = true;
    }

    children.push(childDiff);
  }

  if (hasChanges) {
    return {
      type: DiffType.CHANGED,
      path,
      oldValue: oldObj,
      newValue: newObj,
      children,
    };
  }

  return { type: DiffType.UNCHANGED, path, oldValue: oldObj, newValue: newObj };
}

/**
 * Compare two arrays and generate a diff
 * Uses Levenshtein distance for finding optimal matching between array elements
 */
function compareArrays(
  oldArray: any[],
  newArray: any[],
  options: DiffOptions,
  path: string[],
): DiffResult {
  // Simple case: arrays of different lengths
  if (oldArray.length !== newArray.length) {
    const children: DiffResult[] = [];
    const maxLength = Math.max(oldArray.length, newArray.length);

    for (let i = 0; i < maxLength; i++) {
      const childPath = [...path, i.toString()];
      if (i >= oldArray.length) {
        children.push({
          type: DiffType.ADDED,
          path: childPath,
          newValue: newArray[i],
        });
      } else if (i >= newArray.length) {
        children.push({
          type: DiffType.REMOVED,
          path: childPath,
          oldValue: oldArray[i],
        });
      } else {
        children.push(createDiff(oldArray[i], newArray[i], options, childPath));
      }
    }

    return {
      type: DiffType.CHANGED,
      path,
      oldValue: oldArray,
      newValue: newArray,
      children,
    };
  }

  // For arrays of primitive values or objects, compare each element
  const children: DiffResult[] = [];
  let hasChanges = false;

  for (let i = 0; i < oldArray.length; i++) {
    const childPath = [...path, i.toString()];
    const oldValue = oldArray[i];
    const newValue = newArray[i];
    let childDiff;

    // Special handling for strings - use Levenshtein distance
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      if (oldValue === newValue) {
        childDiff = {
          type: DiffType.UNCHANGED,
          path: childPath,
          oldValue,
          newValue,
        };
      } else {
        const distance = leven(oldValue, newValue);
        const maxLength = Math.max(oldValue.length, newValue.length);
        const similarityRatio = maxLength > 0 ? 1 - distance / maxLength : 1;

        childDiff = {
          type: DiffType.CHANGED,
          path: childPath,
          oldValue,
          newValue,
          meta: {
            levenDistance: distance,
            similarity: similarityRatio,
          },
        };
        hasChanges = true;
      }
    } else {
      // For other types
      childDiff = createDiff(oldValue, newValue, options, childPath);
      if (childDiff.type !== DiffType.UNCHANGED) {
        hasChanges = true;
      }
    }

    children.push(childDiff);
  }

  if (hasChanges) {
    return {
      type: DiffType.CHANGED,
      path,
      oldValue: oldArray,
      newValue: newArray,
      children,
    };
  }

  return {
    type: DiffType.UNCHANGED,
    path,
    oldValue: oldArray,
    newValue: newArray,
  };
}
