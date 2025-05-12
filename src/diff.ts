import leven from 'leven';
import {
  DiffOptions,
  DiffResult,
  DiffValue,
  DiffObject,
  DiffArray,
  DiffChange,
} from './types';

/**
 * Determine if two values are equal
 */
function isEqual(a: DiffValue, b: DiffValue): boolean {
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
    const arrayA = a as DiffArray;
    const arrayB = b as DiffArray;
    if (a.length !== b.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
      if (!isEqual(arrayA[i], arrayB[i])) return false;
    }
    return true;
  }

  // Handle objects
  const objA = a as DiffObject;
  const objB = b as DiffObject;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(objA[key], objB[key])) return false;
  }

  return true;
}

/**
 * Calculate similarity between two objects
 * Returns a number between 0 and 1 (1 being identical)
 */
function calculateSimilarity(a: DiffValue, b: DiffValue): number {
  if (a === b) return 1;
  if (a == null || b == null) return 0;

  // Different types have 0 similarity
  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return 0;

  // Handle strings using Levenshtein distance
  if (typeA === 'string' && typeB === 'string') {
    const strA = a as string;
    const strB = b as string;
    const distance = leven(strA, strB);
    const maxLength = Math.max(strA.length, strB.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  // Handle numbers
  if (typeA === 'number' && typeB === 'number') {
    const numA = a as number;
    const numB = b as number;
    // Normalize numbers to 0-1 range for comparison
    const max = Math.max(Math.abs(numA), Math.abs(numB));
    if (max === 0) return 1; // Both are 0
    return 1 - Math.abs(numA - numB) / (max * 2);
  }

  // Handle booleans
  if (typeA === 'boolean' && typeB === 'boolean') {
    return a === b ? 1 : 0;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    const arrayA = a as DiffArray;
    const arrayB = b as DiffArray;
    if (arrayA.length === 0 && arrayB.length === 0) return 1;
    if (arrayA.length === 0 || arrayB.length === 0) return 0;

    // For arrays, calculate average similarity of best-matching elements
    let totalSimilarity = 0;
    const minLength = Math.min(arrayA.length, arrayB.length);
    const maxLength = Math.max(arrayA.length, arrayB.length);

    // For each element in shorter array, find best match in longer array
    for (let i = 0; i < minLength; i++) {
      const maxSimilarity = calculateSimilarity(arrayA[i], arrayB[i]);
      totalSimilarity += maxSimilarity;
    }

    // Penalize for length difference
    const lengthSimilarity = minLength / maxLength;

    return (totalSimilarity / maxLength) * lengthSimilarity;
  }

  // Handle objects
  if (
    typeA === 'object' &&
    typeB === 'object' &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const objA = a as DiffObject;
    const objB = b as DiffObject;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length === 0 && keysB.length === 0) return 1;
    if (keysA.length === 0 || keysB.length === 0) return 0;

    // Calculate similarity based on common keys and their values
    const allKeys = [...new Set([...keysA, ...keysB])];
    let totalSimilarity = 0;

    for (const key of allKeys) {
      if (key in objA && key in objB) {
        totalSimilarity += calculateSimilarity(objA[key], objB[key]);
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
function findBestMatch(item: DiffValue, array: DiffValue[]): [number, number] {
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
  oldArray: DiffArray,
  newArray: DiffArray,
  options: DiffOptions,
): DiffResult {
  if (oldArray.length === 0 && newArray.length === 0) return [];

  // Fast path for identical arrays
  if (isEqual(oldArray, newArray)) return [...oldArray];

  const result = [] as DiffResult[];
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
  oldObj: DiffObject,
  newObj: DiffObject,
  options: DiffOptions,
): DiffResult {
  const keysOnly = options.keysOnly === true;
  const fullOutput = options.full === true;
  const outputKeys = options.outputKeys || [];
  const result = {} as Record<string, DiffResult>;

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
function diffValues(
  oldValue: DiffValue,
  newValue: DiffValue,
  options: DiffOptions,
): DiffResult {
  // Handle exact equality
  if (isEqual(oldValue, newValue)) {
    return options.full ? oldValue : (undefined as unknown as DiffResult);
  }

  // Handle null/undefined
  if (oldValue == null || newValue == null) {
    return { __old: oldValue, __new: newValue } as DiffChange;
  }

  // Handle different types
  const typeOld = typeof oldValue;
  const typeNew = typeof newValue;

  if (typeOld !== typeNew) {
    return { __old: oldValue, __new: newValue };
  }

  // Handle strings with Levenshtein distance
  if (typeOld === 'string' && typeNew === 'string') {
    // If strings are similar but not identical, we could do character-by-character diff
    // For now, just return the old and new values
    return { __old: oldValue, __new: newValue } as DiffChange;
  }

  // Handle arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return diffArrays(oldValue as DiffArray, newValue as DiffArray, options);
  }

  // Handle objects
  if (
    typeOld === 'object' &&
    typeNew === 'object' &&
    !Array.isArray(oldValue) &&
    !Array.isArray(newValue)
  ) {
    return diffObjects(oldValue as DiffObject, newValue as DiffObject, options);
  }

  // Handle primitives
  return { __old: oldValue, __new: newValue } as DiffChange;
}

/**
 * Generate a diff between two values
 */
export function diff(
  oldValue: DiffValue,
  newValue: DiffValue,
  options: DiffOptions = {},
): DiffResult {
  const result = diffValues(oldValue, newValue, options);

  // If no differences found, return empty object
  if (result === undefined) {
    return {} as Record<string, DiffResult>;
  }

  return result;
}
