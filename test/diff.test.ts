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
      // const result = diff(
      //   { foo: 'bar' },
      //   { foo: 'baz' },
      //   { color: false },
      // );
      // TODO:Check for added and removed lines
    });

    test('should respect the full option', () => {
      const result = diff(
        { foo: 'bar', unchanged: 'same' },
        { foo: 'baz', unchanged: 'same' },
        { full: true, color: false },
      );
      // TODO:Check for added and removed lines

      expect(result).toContain('same');
    });

    test('should respect the outputKeys option', () => {
      const result = diff(
        { foo: 'bar', id: 123 },
        { foo: 'baz', id: 123 },
        { outputKeys: ['id'], color: false },
      );

      // TODO:Check for added and removed lines
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

      // Empty objects should not have newlines

      // TODO:Check for added and removed lines
    });
  });
});
