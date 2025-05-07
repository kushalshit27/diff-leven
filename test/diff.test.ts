import { diff, diffString } from '../src';
import { describe, test, expect } from 'vitest';

describe('diff-leven', () => {
  describe('diff function', () => {
    test('should return empty result for identical primitives', () => {
      expect(diff(1, 1)).toEqual({});
      expect(diff('hello', 'hello')).toEqual({});
      expect(diff(true, true)).toEqual({});
      expect(diff(null, null)).toEqual({});
    });

    test('should detect changes in primitives', () => {
      expect(diff(1, 2)).toEqual({ __old: 1, __new: 2 });
      expect(diff('hello', 'world')).toEqual({ __old: 'hello', __new: 'world' });
      expect(diff(true, false)).toEqual({ __old: true, __new: false });
    });

    test('should handle null and undefined correctly', () => {
      expect(diff(null, undefined)).toEqual({ __old: null, __new: undefined });
      expect(diff(undefined, 1)).toEqual({ __old: undefined, __new: 1 });
      expect(diff(1, undefined)).toEqual({ __old: 1, __new: undefined });
    });

    test('should detect changes in objects', () => {
      expect(diff({ a: 1 }, { a: 2 })).toEqual({ a: { __old: 1, __new: 2 } });
      expect(diff({ a: 1 }, { b: 1 })).toEqual({
        a: { __old: 1, __new: undefined },
        b: { __old: undefined, __new: 1 },
      });
    });

    test('should detect changes in nested objects', () => {
      const oldObj = { user: { name: 'Alice', age: 25 } };
      const newObj = { user: { name: 'Alice', age: 26 } };

      expect(diff(oldObj, newObj)).toEqual({
        user: { age: { __old: 25, __new: 26 } },
      });
    });

    test('should handle arrays', () => {
      expect(diff([1, 2, 3], [1, 2, 3])).toEqual({});
      expect(diff([1, 2, 3], [1, 2, 3, 4])).toEqual([
        1, 2, 3, { __old: undefined, __new: 4 },
      ]);
      expect(diff([1, 2, 3], [1, 4, 3])).toEqual([
        1,
        { __old: 2, __new: 4 },
        3,
      ]);
    });

    test('should handle the full option', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1, b: 3 };

      expect(diff(oldObj, newObj, { full: true })).toEqual({
        a: 1,
        b: { __old: 2, __new: 3 },
      });
    });

    test('should handle the keysOnly option', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 3, c: 4 };

      // With keysOnly, we should only see structural differences
      const result = diff(oldObj, newObj, { keysOnly: true });
      expect(result).toEqual({
        b: { __old: 2, __new: undefined },
        c: { __old: undefined, __new: 4 },
      });

      // Combined with full option
      const fullResult = diff(oldObj, newObj, { keysOnly: true, full: true });
      expect(fullResult).toEqual({
        a: null,  // Present in both, so null with keysOnly & full
        b: { __old: 2, __new: undefined },
        c: { __old: undefined, __new: 4 },
      });
    });

    test('should handle the outputKeys option', () => {
      const oldObj = { a: 1, b: 2, c: 3 };
      const newObj = { a: 1, b: 3, c: 3 };

      const result = diff(oldObj, newObj, { outputKeys: ['a', 'c'] });
      expect(result).toEqual({
        a: 1,  // Included because it's in outputKeys
        b: { __old: 2, __new: 3 },  // Included because it's different
        c: 3,  // Included because it's in outputKeys
      });
    });
  });

  describe('diffString function', () => {
    test('should format simple object differences as a string', () => {
      const oldObj = { foo: 'bar' };
      const newObj = { foo: 'baz' };

      const result = diffString(oldObj, newObj, { color: false });
      expect(result).toContain('- "bar"');
      expect(result).toContain('+ "baz"');
    });

    test('should format nested object differences as a string', () => {
      const oldObj = { user: { name: 'Alice', age: 25 } };
      const newObj = { user: { name: 'Bob', age: 25 } };

      const result = diffString(oldObj, newObj, { color: false });
      expect(result).toContain('- "Alice"');
      expect(result).toContain('+ "Bob"');
    });
  });
});
