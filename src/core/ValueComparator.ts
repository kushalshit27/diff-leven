import leven from 'leven';

/**
 * A utility class for comparing values and calculating similarity
 */
export class ValueComparator {
  /**
   * Determine if two values are equal
   */
  public isEqual(a: any, b: any): boolean {
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
        if (!this.isEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // Handle objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.isEqual(a[key], b[key])) return false;
    }

    return true;
  }

  /**
   * Calculate similarity between two objects
   * Returns a number between 0 and 1 (1 being identical)
   */
  public calculateSimilarity(a: any, b: any): number {
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
        let maxSimilarity = this.calculateSimilarity(a[i], b[i]);
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
          totalSimilarity += this.calculateSimilarity(a[key], b[key]);
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
  public findBestMatch(item: any, array: any[]): [number, number] {
    if (array.length === 0) return [-1, 0];

    let bestIndex = 0;
    let bestScore = this.calculateSimilarity(item, array[0]);

    for (let i = 1; i < array.length; i++) {
      const score = this.calculateSimilarity(item, array[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    return [bestIndex, bestScore];
  }
}
