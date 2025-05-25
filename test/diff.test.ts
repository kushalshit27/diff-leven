import { describe, expect, test } from 'vitest';
import { diffRaw, diff } from '../src';

describe('diff-leven', () => {
  describe('diffRaw()', () => {
    test('should detect changes in primitive values', () => {
      const result = diffRaw('hello', 'world');
      expect(result.type).toBe('changed');
      expect(result.oldValue).toBe('hello');
      expect(result.newValue).toBe('world');
    });

    test('should detect unchanged values', () => {
      const result = diffRaw('same', 'same');
      expect(result.type).toBe('unchanged');
      expect(result.oldValue).toBe('same');
      expect(result.newValue).toBe('same');
    });

    test('should handle null values', () => {
      const result = diffRaw(null, 'value');
      expect(result.type).toBe('changed');
      expect(result.oldValue).toBe(null);
      expect(result.newValue).toBe('value');
    });

    test('should handle undefined values', () => {
      const result = diffRaw(undefined, 'value');
      expect(result.type).toBe('added');
      expect(result.newValue).toBe('value');
    });

    test('should detect added keys in objects', () => {
      const result = diffRaw({ a: 1 }, { a: 1, b: 2 });
      expect(result.type).toBe('changed');

      const bChange = result.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'b',
      );

      expect(bChange?.type).toBe('added');
      expect(bChange?.newValue).toBe(2);
    });

    test('should detect removed keys in objects', () => {
      const result = diffRaw({ a: 1, b: 2 }, { a: 1 });
      expect(result.type).toBe('changed');

      const bChange = result.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'b',
      );

      expect(bChange?.type).toBe('removed');
      expect(bChange?.oldValue).toBe(2);
    });

    test('should detect changed values in objects', () => {
      const result = diffRaw({ a: 1, b: 2 }, { a: 1, b: 3 });
      expect(result.type).toBe('changed');

      const bChange = result.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'b',
      );

      expect(bChange?.type).toBe('changed');
      expect(bChange?.oldValue).toBe(2);
      expect(bChange?.newValue).toBe(3);
    });

    test('should handle nested objects', () => {
      const result = diffRaw(
        { user: { name: 'Alice', age: 30 } },
        { user: { name: 'Alice', age: 31 } },
      );

      expect(result.type).toBe('changed');

      const userChange = result.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'user',
      );

      expect(userChange?.type).toBe('changed');

      const ageChange = userChange?.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'age',
      );

      expect(ageChange?.type).toBe('changed');
      expect(ageChange?.oldValue).toBe(30);
      expect(ageChange?.newValue).toBe(31);
    });

    test('should handle arrays', () => {
      const result = diffRaw([1, 2, 3], [1, 2, 4]);
      expect(result.type).toBe('changed');

      const thirdElementChange = result.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === '2',
      );

      expect(thirdElementChange?.type).toBe('changed');
      expect(thirdElementChange?.oldValue).toBe(3);
      expect(thirdElementChange?.newValue).toBe(4);
    });

    test('should respect the keysOnly option', () => {
      const result = diffRaw(
        { a: 1, b: { c: 2 } },
        { a: 2, b: { c: 3, d: 4 } },
        { keysOnly: true },
      );

      expect(result.type).toBe('changed');

      const bChange = result.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'b',
      );

      expect(bChange?.type).toBe('changed');

      const dChange = bChange?.children?.find(
        (child) => child.path && child.path[child.path.length - 1] === 'd',
      );

      expect(dChange?.type).toBe('added');
    });

    test('should respect the ignoreKeys option', () => {
      const result = diffRaw(
        { a: 1, timestamp: 123 },
        { a: 1, timestamp: 456 },
        { ignoreKeys: ['timestamp'] },
      );

      expect(result.type).toBe('unchanged');
    });

    test('should respect the ignoreValues option', () => {
      const result = diffRaw(
        { a: 1, b: 2 },
        { a: 3, b: 4 },
        { ignoreValues: true },
      );

      expect(result.type).toBe('unchanged');
    });
  });

  describe('diff()', () => {
    test('should format simple differences', () => {
      const result = diff({ foo: 'bar' }, { foo: 'baz' }, { color: false });

      expect(result).toContain("- foo: 'bar'");
      expect(result).toContain("+ foo: 'baz'");
    });

    test('should respect the full option', () => {
      const result = diff(
        { foo: 'bar', unchanged: 'same' },
        { foo: 'baz', unchanged: 'same' },
        { full: true, color: false },
      );

      expect(result).toContain("- foo: 'bar'");
      expect(result).toContain("+ foo: 'baz'");
      expect(result).toContain("  unchanged: 'same'");
    });

    test('should respect the outputKeys option', () => {
      const result = diff(
        { foo: 'bar', id: 123 },
        { foo: 'baz', id: 123 },
        { outputKeys: ['id'], color: false },
      );

      expect(result).toContain("- foo: 'bar'");
      expect(result).toContain("+ foo: 'baz'");
      expect(result).toContain('id: 123');
    });

    test('should format objects with no comments and proper indentation', () => {
      const result = diff(
        { foo: 'bar', count: 1 },
        { foo: 'baz', count: 2 },
        { color: false },
      );

      // Should not contain comments
      expect(result).not.toContain('Added');
      expect(result).not.toContain('Removed');
      expect(result).not.toContain('Changed');

      // Check for proper added and removed lines
      expect(result).toContain("- foo: 'bar'");
      expect(result).toContain("+ foo: 'baz'");
      expect(result).toContain('- count: 1');
      expect(result).toContain('+ count: 2');

      // Check for proper indentation
      expect(result).toMatch(/^\{\n\s{2}[-+]\s/m);

      // Check for proper closing brace
      expect(result).toMatch(/\n\}/);
    });

    test('should handle string comparison with Levenshtein distance', () => {
      const result = diff('hello world', 'hello there', { color: false });

      expect(result).toContain("- 'hello world'");
      expect(result).toContain("+ 'hello there'");
    });

    test('should handle array differences', () => {
      const result = diff([1, 2, 3], [1, 4, 3], { color: false });

      expect(result).toContain('- 2');
      expect(result).toContain('+ 4');
    });

    test('should respect the ignoreKeys option', () => {
      const result = diff(
        { name: 'John', timestamp: 123 },
        { name: 'John', timestamp: 456 },
        { ignoreKeys: ['timestamp'], color: false },
      );

      // Should be empty as only the ignored key is different
      expect(result.trim()).toBe('');
    });

    test('should respect the ignoreValues option', () => {
      const result = diff(
        { a: 1, b: 2 },
        { a: 3, b: 4 },
        { ignoreValues: true, color: false },
      );

      // Should be empty as only values are different
      expect(result.trim()).toBe('');
    });

    test('should handle nested objects', () => {
      const result = diff(
        { user: { name: 'Alice', age: 30 } },
        { user: { name: 'Alice', age: 31 } },
        { color: false },
      );

      expect(result).toContain('- age: 30');
      expect(result).toContain('+ age: 31');
    });

    // Edge cases and more complex tests

    test('should handle null values', () => {
      const result = diff(
        { name: 'John', data: null },
        { name: 'John', data: { id: 123 } },
        { color: false },
      );

      expect(result).toContain('- data: null');
      expect(result).toContain('+ data:');
      expect(result).toContain('id');
      expect(result).toContain('123');
    });

    test('should handle undefined values', () => {
      const result = diff(
        { name: 'John', address: undefined },
        { name: 'John', address: 'New York' },
        { color: false },
      );

      // Only the added value should be shown as undefined is treated as non-existent
      expect(result).toContain("+ address: 'New York'");
      expect(result).not.toContain('undefined');
    });

    test('should handle arrays of different lengths', () => {
      const result = diff([1, 2, 3], [1, 2, 3, 4, 5], { color: false });

      expect(result).toContain('+ 4');
      expect(result).toContain('+ 5');
    });

    test('should handle empty arrays', () => {
      const result = diff([], [1, 2, 3], { color: false });

      expect(result).toContain('+ 1');
      expect(result).toContain('+ 2');
      expect(result).toContain('+ 3');
    });

    test('should handle empty objects', () => {
      const result = diff({}, { a: 1, b: 2 }, { color: false });

      expect(result).toContain('+ a: 1');
      expect(result).toContain('+ b: 2');
    });

    test('should handle boolean values', () => {
      const result = diff(
        { feature1: true, feature2: false },
        { feature1: false, feature2: true },
        { color: false },
      );

      expect(result).toContain('- feature1: true');
      expect(result).toContain('+ feature1: false');
      expect(result).toContain('- feature2: false');
      expect(result).toContain('+ feature2: true');
    });

    test('should handle number values', () => {
      const result = diff(
        { count: 0, price: -1, amount: 9999 },
        { count: 1, price: 99.99, amount: 9999 },
        { color: false },
      );

      expect(result).toContain('- count: 0');
      expect(result).toContain('+ count: 1');
      expect(result).toContain('- price: -1');
      expect(result).toContain('+ price: 99.99');
      // amount is unchanged, so it shouldn't appear by default
      expect(result).not.toContain('amount: 9999');
    });

    test('should handle complex nested structures', () => {
      const obj1 = {
        users: [
          { id: 1, name: 'Alice', roles: ['admin', 'user'] },
          { id: 2, name: 'Bob', roles: ['user'] },
        ],
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
          },
        },
      };

      const obj2 = {
        users: [
          { id: 1, name: 'Alice', roles: ['admin', 'user', 'editor'] },
          { id: 3, name: 'Charlie', roles: ['user'] },
        ],
        settings: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
      };

      const result = diff(obj1, obj2, { color: false });

      // Check a few key differences
      expect(result).toContain("'editor'");
      expect(result).toContain("'Bob'");
      expect(result).toContain("'Charlie'");
      expect(result).toContain("'dark'");
      expect(result).toContain("'light'");
      expect(result).toContain('sms: false');
      expect(result).toContain('push: false');
      expect(result).toContain('push: true');
    });

    test('should handle when both objects are identical', () => {
      const obj = { name: 'John', age: 30, address: { city: 'New York' } };
      const result = diff(obj, obj, { color: false });

      // Should be empty as there are no differences
      expect(result.trim()).toBe('');
    });

    test('should combine multiple options correctly', () => {
      const result = diff(
        { id: 1, name: 'John', timestamp: 123, data: { count: 1 } },
        { id: 1, name: 'Jane', timestamp: 456, data: { count: 2 } },
        {
          ignoreKeys: ['timestamp'],
          outputKeys: ['id'],
          color: false,
        },
      );

      expect(result).toContain('  id: 1');
      expect(result).toContain("- name: 'John'");
      expect(result).toContain("+ name: 'Jane'");
      expect(result).toContain('- count: 1');
      expect(result).toContain('+ count: 2');
      expect(result).not.toContain('timestamp');
    });
  });
});
