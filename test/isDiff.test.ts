import { describe, expect, test } from 'vitest';
import { isDiff } from '../src';

describe('isDiff()', () => {
  test('should return false for identical primitive values', () => {
    expect(isDiff('hello', 'hello')).toBe(false);
    expect(isDiff(123, 123)).toBe(false);
    expect(isDiff(true, true)).toBe(false);
    expect(isDiff(null, null)).toBe(false);
  });

  test('should return true for different primitive values', () => {
    expect(isDiff('hello', 'world')).toBe(true);
    expect(isDiff(123, 456)).toBe(true);
    expect(isDiff(true, false)).toBe(true);
    expect(isDiff(null, 'value')).toBe(true);
  });

  test('should handle undefined values', () => {
    expect(isDiff(undefined, undefined)).toBe(false);
    expect(isDiff(undefined, 'value')).toBe(true);
    expect(isDiff('value', undefined)).toBe(true);
  });

  test('should detect differences in objects', () => {
    expect(isDiff({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(false);
    expect(isDiff({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(true);
    expect(isDiff({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(true);
    expect(isDiff({ a: 1, b: 2 }, { a: 1 })).toBe(true);
  });

  test('should detect differences in nested objects', () => {
    expect(
      isDiff(
        { user: { name: 'Alice', age: 30 } },
        { user: { name: 'Alice', age: 30 } },
      ),
    ).toBe(false);

    expect(
      isDiff(
        { user: { name: 'Alice', age: 30 } },
        { user: { name: 'Alice', age: 31 } },
      ),
    ).toBe(true);
  });

  test('should detect differences in arrays', () => {
    expect(isDiff([1, 2, 3], [1, 2, 3])).toBe(false);
    expect(isDiff([1, 2, 3], [1, 2, 4])).toBe(true);
    expect(isDiff([1, 2, 3], [1, 2])).toBe(true);
    expect(isDiff([1, 2], [1, 2, 3])).toBe(true);
  });

  test('should respect the keysOnly option', () => {
    expect(
      isDiff({ a: 1, b: { c: 2 } }, { a: 2, b: { c: 3 } }, { keysOnly: true }),
    ).toBe(false);

    expect(
      isDiff(
        { a: 1, b: { c: 2 } },
        { a: 2, b: { c: 3, d: 4 } },
        { keysOnly: true },
      ),
    ).toBe(true);
  });

  test('should respect the ignoreKeys option', () => {
    expect(
      isDiff(
        { a: 1, timestamp: 123 },
        { a: 1, timestamp: 456 },
        { ignoreKeys: ['timestamp'] },
      ),
    ).toBe(false);

    expect(
      isDiff(
        { a: 1, timestamp: 123 },
        { a: 2, timestamp: 456 },
        { ignoreKeys: ['timestamp'] },
      ),
    ).toBe(true);
  });

  test('should respect the ignoreValues option', () => {
    expect(isDiff({ a: 1, b: 2 }, { a: 3, b: 4 }, { ignoreValues: true })).toBe(
      false,
    );

    expect(
      isDiff({ a: 1, b: 2 }, { a: 3, b: 4, c: 5 }, { ignoreValues: true }),
    ).toBe(true);
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

    expect(isDiff(obj1, obj2)).toBe(false);

    // Make a small change
    obj2.settings.theme = 'light';
    expect(isDiff(obj1, obj2)).toBe(true);
  });
});
