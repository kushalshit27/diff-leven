import { describe, test, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { diff, diffString, DiffResult } from '../src';
// Import the core classes directly for testing
import { DiffEngine } from '../src/core/DiffEngine';
import { DiffFormatter } from '../src/core/DiffFormatter';
import { ValueComparator } from '../src/core/ValueComparator';

describe('diff', () => {
  // Basic Tests
  test('identical values return empty diff', () => {
    const obj = { foo: 'bar', count: 42 };
    expect(diff(obj, obj)).toEqual({});
  });

  test('different primitives return diff with __old and __new', () => {
    expect(diff('hello', 'world')).toEqual({
      __old: 'hello',
      __new: 'world',
    });
  });

  // Type-specific Tests
  test('string comparison', () => {
    expect(diff('hello', 'hallo')).toEqual({
      __old: 'hello',
      __new: 'hallo',
    });
  });

  test('number comparison', () => {
    expect(diff(42, 43)).toEqual({
      __old: 42,
      __new: 43,
    });
  });

  test('boolean comparison', () => {
    expect(diff(true, false)).toEqual({
      __old: true,
      __new: false,
    });
  });

  test('array comparison', () => {
    const result = diff([1, 2, 3], [1, 4, 3]);
    expect(result[1]).toHaveProperty('__old', 2);
    expect(result[1]).toHaveProperty('__new', 4);
  });

  test('object comparison', () => {
    const result = diff({ a: 1, b: 2 }, { a: 1, b: 3 });
    expect(result).toHaveProperty('b');
    expect(result.b).toHaveProperty('__old', 2);
    expect(result.b).toHaveProperty('__new', 3);
  });

  // Nested structure tests
  test('nested object comparison', () => {
    const obj1 = {
      user: {
        name: 'Alice',
        details: {
          age: 30,
          location: 'New York',
        },
      },
    };

    const obj2 = {
      user: {
        name: 'Alice',
        details: {
          age: 31,
          location: 'Boston',
        },
      },
    };

    const result = diff(obj1, obj2);
    expect(result.user.details.age).toHaveProperty('__old', 30);
    expect(result.user.details.age).toHaveProperty('__new', 31);
    expect(result.user.details.location).toHaveProperty('__old', 'New York');
    expect(result.user.details.location).toHaveProperty('__new', 'Boston');
  });

  // Option Tests
  test('keysOnly option', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 5, b: 6 };
    const result = diff(obj1, obj2, { keysOnly: true });
    expect(result).toEqual({});
  });

  test('full option', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 6, c: 3 };
    const result = diff(obj1, obj2, { full: true });
    expect(result).toHaveProperty('a', 1);
    expect(result).toHaveProperty('c', 3);
    expect(result.b).toHaveProperty('__old', 2);
    expect(result.b).toHaveProperty('__new', 6);
  });

  test('outputKeys option', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 6, c: 3 };
    const result = diff(obj1, obj2, { outputKeys: ['a', 'c'] });
    expect(result).toHaveProperty('a', 1);
    expect(result).toHaveProperty('c', 3);
    expect(result.b).toHaveProperty('__old', 2);
    expect(result.b).toHaveProperty('__new', 6);
  });

  test('ignoreKeys option', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 5, b: 6, c: 3 };
    const result = diff(obj1, obj2, { ignoreKeys: ['b'] });
    expect(result).toHaveProperty('a');
    expect(result.a).toHaveProperty('__old', 1);
    expect(result.a).toHaveProperty('__new', 5);
    expect(result).not.toHaveProperty('b');
  });

  test('ignoreValues option', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 5, b: 6, c: 3 };
    const result = diff(obj1, obj2, { ignoreValues: true });
    expect(result).toEqual({});
  });

  // Added/removed property tests
  test('detects added properties', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1, b: 2 };
    const result = diff(obj1, obj2);
    expect(result).toHaveProperty('b');
    expect(result.b).toHaveProperty('__old', undefined);
    expect(result.b).toHaveProperty('__new', 2);
  });

  test('detects removed properties', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };
    const result = diff(obj1, obj2);
    expect(result).toHaveProperty('b');
    expect(result.b).toHaveProperty('__old', 2);
    expect(result.b).toHaveProperty('__new', undefined);
  });
});

describe('diffString', () => {
  test('returns formatted string output', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    const result = diffString(obj1, obj2, { color: false });
    expect(typeof result).toBe('string');
    expect(result).toContain('a: 1');
    expect(result).toContain('a: 2');
  });
});

describe('ValueComparator', () => {
  const comparator = new ValueComparator();

  test('isEqual correctly identifies equal values', () => {
    expect(comparator.isEqual(1, 1)).toBe(true);
    expect(comparator.isEqual('hello', 'hello')).toBe(true);
    expect(comparator.isEqual([1, 2], [1, 2])).toBe(true);
    expect(comparator.isEqual({ a: 1 }, { a: 1 })).toBe(true);
  });

  test('isEqual correctly identifies different values', () => {
    expect(comparator.isEqual(1, 2)).toBe(false);
    expect(comparator.isEqual('hello', 'world')).toBe(false);
    expect(comparator.isEqual([1, 2], [3, 4])).toBe(false);
    expect(comparator.isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  test('calculateSimilarity returns 1 for identical values', () => {
    expect(comparator.calculateSimilarity(1, 1)).toBe(1);
    expect(comparator.calculateSimilarity('hello', 'hello')).toBe(1);
  });

  test('calculateSimilarity returns value between 0 and 1 for similar strings', () => {
    const similarity = comparator.calculateSimilarity('hello', 'hallo');
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  test('findBestMatch finds best matching element in array', () => {
    const [index, score] = comparator.findBestMatch('hello', [
      'hallo',
      'goodbye',
      'hi',
    ]);
    expect(index).toBe(0); // 'hallo' is most similar to 'hello'
    expect(score).toBeGreaterThan(0);
  });
});

describe('DiffFormatter', () => {
  const formatter = new DiffFormatter();

  test('formatValue handles different types', () => {
    expect(formatter.formatValue('hello')).toBe('"hello"');
    expect(formatter.formatValue(42)).toBe('42');
    expect(formatter.formatValue(null)).toBe('null');
    expect(formatter.formatValue(undefined)).toBe('undefined');
  });

  test('formatDiff generates proper output', () => {
    const diffResult = { __old: 'hello', __new: 'world' };
    const output = formatter.formatDiff(diffResult, 0, { color: false });
    expect(output).toContain('- "hello"');
    expect(output).toContain('+ "world"');
  });
});

describe('DiffEngine', () => {
  const engine = new DiffEngine();

  test('diff method produces correct diff output', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    const result = engine.diff(obj1, obj2);
    expect(result).toHaveProperty('b');
    expect(result.b).toHaveProperty('__old', 2);
    expect(result.b).toHaveProperty('__new', 3);
  });

  test('diffToString produces formatted output', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    const result = engine.diffToString(obj1, obj2, { color: false });
    expect(result).toContain('- b: 2');
    expect(result).toContain('+ b: 3');
  });
});

describe('Combined option tests', () => {
  test('combination of keysOnly and ignoreKeys', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 5, b: 6, c: 7 };
    const result = diff(obj1, obj2, {
      keysOnly: true,
      ignoreKeys: ['b'],
    });
    expect(result).toEqual({});
    expect(result).not.toHaveProperty('b');
  });

  test('combination of full and ignoreValues', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 5, b: 6, c: 7 };
    const result = diff(obj1, obj2, {
      full: true,
      ignoreValues: true,
    });
    expect(result).toHaveProperty('a');
    expect(result).toHaveProperty('b');
    expect(result).toHaveProperty('c');
    expect(result.a).not.toHaveProperty('__old');
    expect(result.a).not.toHaveProperty('__new');
  });

  test('combination of outputKeys, ignoreKeys and ignoreValues', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 5, b: 6, c: 7 };
    const result = diff(obj1, obj2, {
      outputKeys: ['a', 'c'],
      ignoreKeys: ['b'],
      ignoreValues: true,
    });
    expect(result).toHaveProperty('a');
    expect(result).toHaveProperty('c');
    expect(result).not.toHaveProperty('b');
  });
});
