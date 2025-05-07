import leven from 'leven';
import { DiffOptions, DiffResult } from './types';

/**
 * Determine if two values are equal
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;

  // Handle different types
  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return false;

  // Handle primitives
  if (typeA !== 'object') return a === b;

  // Handle arrays
  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);
  if (isArrayA !== isArrayB) return false;

  if (isArrayA && isArrayB) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Calculate similarity between two objects
 * Returns a number between 0 and 1 (1 being identical)
 */
function calculateSimilarity(a: any, b: any): number {
  if (a === b) return 1;
  if (a == null || b == null) return 0;

  // Different types have 0 similarity
  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return 0;

  // Handle strings using Levenshtein distance
  if (typeA === 'string') {
    const distance = leven(a, b);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  // Handle numbers
  if (typeA === 'number') {
    // Normalize numbers to 0-1 range for comparison
    const max = Math.max(Math.abs(a), Math.abs(b));
    if (max === 0) return 1; // Both are 0
    return 1 - Math.abs(a - b) / (max * 2);
  }

  // Handle booleans
  if (typeA === 'boolean') {
    return a === b ? 1 : 0;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // For arrays, calculate average similarity of best-matching elements
    let totalSimilarity = 0;
    const minLength = Math.min(a.length, b.length);
    const maxLength = Math.max(a.length, b.length);

    // For each element in shorter array, find best match in longer array
    for (let i = 0; i < minLength; i++) {
      let maxSimilarity = calculateSimilarity(a[i], b[i]);
      totalSimilarity += maxSimilarity;
    }

    // Penalize for length difference
    const lengthSimilarity = minLength / maxLength;

    return (totalSimilarity / maxLength) * lengthSimilarity;
  }

  // Handle objects
  if (typeA === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length === 0 && keysB.length === 0) return 1;
    if (keysA.length === 0 || keysB.length === 0) return 0;

    // Calculate similarity based on common keys and their values
    const allKeys = [...new Set([...keysA, ...keysB])];
    let totalSimilarity = 0;

    for (const key of allKeys) {
      if (key in a && key in b) {
        totalSimilarity += calculateSimilarity(a[key], b[key]);
      }
    }

    // Calculate key overlap similarity
    const commonKeyCount = keysA.filter((key) => keysB.includes(key)).length;
    const keyOverlapSimilarity = commonKeyCount / allKeys.length;

    return (totalSimilarity / allKeys.length) * keyOverlapSimilarity;
  }

  // Default case
  return a === b ? 1 : 0;
}

/**
 * Find the best match for an item in an array based on similarity
 * Returns [matchIndex, similarityScore]
 */
function findBestMatch(item: any, array: any[]): [number, number] {
  if (array.length === 0) return [-1, 0];

  let bestIndex = 0;
  let bestScore = calculateSimilarity(item, array[0]);

  for (let i = 1; i < array.length; i++) {
    const score = calculateSimilarity(item, array[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return [bestIndex, bestScore];
}

/**
 * Compare two arrays and generate diff result
 */
function diffArrays(
  oldArray: any[],
  newArray: any[],
  options: DiffOptions,
): DiffResult {
  if (oldArray.length === 0 && newArray.length === 0) return [];

  // Fast path for identical arrays
  if (isEqual(oldArray, newArray)) return [...oldArray];

  const result: DiffResult = [];
  const matchedIndices = new Set<number>();

  // First pass: find matches for oldArray items in newArray
  for (let i = 0; i < oldArray.length; i++) {
    const oldItem = oldArray[i];

    // Find best match in newArray
    const [bestMatchIndex, similarity] = findBestMatch(oldItem, newArray);

    // If good match found and not already matched
    if (
      bestMatchIndex >= 0 &&
      similarity > 0.7 &&
      !matchedIndices.has(bestMatchIndex)
    ) {
      matchedIndices.add(bestMatchIndex);

      // Compare the matched items
      const diffItem = diffValues(oldItem, newArray[bestMatchIndex], options);
      result.push(diffItem);
    } else {
      // No good match found, mark as removed
      result.push({ __old: oldItem, __new: undefined });
    }
  }

  // Second pass: handle unmatched new items
  for (let j = 0; j < newArray.length; j++) {
    if (!matchedIndices.has(j)) {
      // Unmatched new item, mark as added
      result.push({ __old: undefined, __new: newArray[j] });
    }
  }

  return result;
}

/**
 * Compare two objects and generate diff result
 */
function diffObjects(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  options: DiffOptions,
): DiffResult {
  const keysOnly = options.keysOnly === true;
  const fullOutput = options.full === true;
  const outputKeys = options.outputKeys || [];
  const result: DiffResult = {};

  // Process all keys from both objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Keys existing in both objects
    if (key in oldObj && key in newObj) {
      if (keysOnly) {
        // In keysOnly mode, just check if the key exists in both
        if (fullOutput) {
          result[key] = null;
        }
        continue;
      }

      const isDifferent = !isEqual(oldValue, newValue);

      if (isDifferent || fullOutput || outputKeys.includes(key)) {
        result[key] = diffValues(oldValue, newValue, options);
      }
    }
    // Keys only in oldObj (deleted)
    else if (key in oldObj) {
      result[key] = { __old: oldValue, __new: undefined };
    }
    // Keys only in newObj (added)
    else {
      result[key] = { __old: undefined, __new: newValue };
    }
  }

  return result;
}

/**
 * Compare two values of any type and generate a diff result
 */
function diffValues(oldValue: any, newValue: any, options: DiffOptions): any {
  // Handle exact equality
  if (isEqual(oldValue, newValue)) {
    return options.full ? oldValue : undefined;
  }

  // Handle null/undefined
  if (oldValue == null || newValue == null) {
    return { __old: oldValue, __new: newValue };
  }

  // Handle different types
  const typeOld = typeof oldValue;
  const typeNew = typeof newValue;

  if (typeOld !== typeNew) {
    return { __old: oldValue, __new: newValue };
  }

  // Handle strings with Levenshtein distance
  if (typeOld === 'string') {
    // If strings are similar but not identical, we could do character-by-character diff
    // For now, just return the old and new values
    return { __old: oldValue, __new: newValue };
  }

  // Handle arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return diffArrays(oldValue, newValue, options);
  }

  // Handle objects
  if (typeOld === 'object' && typeNew === 'object') {
    return diffObjects(oldValue, newValue, options);
  }

  // Handle primitives
  return { __old: oldValue, __new: newValue };
}

/**
 * Generate a diff between two values
 */
export function diff(
  oldValue: any,
  newValue: any,
  options: DiffOptions = {},
): DiffResult {
  const result = diffValues(oldValue, newValue, options);

  // If no differences found, return empty object
  if (result === undefined) {
    return {};
  }

  return result;
}
