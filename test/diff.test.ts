import { describe, expect, test } from 'vitest';
import { diffRaw, diff } from '../src';
import { DiffType } from '../src/types';

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

    test('should respect ignoreValues for arrays of strings', () => {
      const result = diffRaw(['alpha', 'beta'], ['gamma', 'delta'], {
        ignoreValues: true,
      });

      expect(result.type).toBe('unchanged');
    });

    test('should respect keysOnly for arrays of strings', () => {
      const result = diffRaw(['left', 'right'], ['up', 'down'], {
        keysOnly: true,
      });

      expect(result.type).toBe('unchanged');
    });

    test('should detect array vs object type mismatch as changed', () => {
      const result = diffRaw([1, 2, 3], { 0: 1, 1: 2, 2: 3 });
      expect(result.type).toBe('changed');
    });

    test('should detect object vs array type mismatch as changed', () => {
      const result = diffRaw({ items: [1, 2] }, { items: { 0: 1, 1: 2 } });
      expect(result.type).toBe('changed');
      const itemsChange = result.children?.find(
        (c) => c.path?.[c.path.length - 1] === 'items',
      );
      expect(itemsChange?.type).toBe('changed');
    });

    test('should handle null as both old and new values as unchanged', () => {
      const result = diffRaw(null, null);
      expect(result.type).toBe('unchanged');
    });

    // withSimilarity / meta
    test('should attach levenDistance and similarity meta to string changes', () => {
      const result = diffRaw('kitten', 'sitting');
      expect(result.type).toBe(DiffType.CHANGED);
      expect(result.meta?.levenDistance).toBe(3);
      expect(typeof result.meta?.similarity).toBe('number');
      expect(result.meta!.similarity).toBeGreaterThan(0);
      expect(result.meta!.similarity).toBeLessThan(1);
    });

    test('should not attach meta to non-string primitive changes', () => {
      expect(diffRaw(1, 2).meta).toBeUndefined();
    });

    test('should not attach meta to unchanged strings', () => {
      const result = diffRaw('hello', 'hello');
      expect(result.type).toBe(DiffType.UNCHANGED);
      expect(result.meta).toBeUndefined();
    });

    test('should not attach meta to object-level or added results', () => {
      expect(diffRaw({ a: 1 }, { a: 2 }).meta).toBeUndefined();
      expect(diffRaw(undefined, 'hello').meta).toBeUndefined();
      expect(diffRaw(7, 7).meta).toBeUndefined();
      const child = diffRaw({ score: 10 }, { score: 20 }).children?.[0];
      expect(child?.meta).toBeUndefined();
    });

    // primitive type mismatches
    test('should detect number vs string as changed', () => {
      const result = diffRaw(42, '42');
      expect(result.type).toBe(DiffType.CHANGED);
      expect(result.oldValue).toBe(42);
      expect(result.newValue).toBe('42');
    });

    test('should detect boolean vs number as changed', () => {
      expect(diffRaw(true, 1).type).toBe(DiffType.CHANGED);
      expect(diffRaw(false, 0).type).toBe(DiffType.CHANGED);
    });

    test('should detect null vs falsy primitives as changed', () => {
      expect(diffRaw(null, false).type).toBe(DiffType.CHANGED);
      expect(diffRaw(null, 0).type).toBe(DiffType.CHANGED);
      expect(diffRaw(null, '').type).toBe(DiffType.CHANGED);
    });

    test('should detect number-to-null change inside an object', () => {
      const child = diffRaw({ x: 5 }, { x: null }).children?.[0];
      expect(child?.type).toBe(DiffType.CHANGED);
      expect(child?.oldValue).toBe(5);
      expect(child?.newValue).toBe(null);
    });

    // path tracking
    test('should build nested path correctly', () => {
      const result = diffRaw({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } });
      const a = result.children?.find((c) => c.path?.at(-1) === 'a');
      const b = a?.children?.find((c) => c.path?.at(-1) === 'b');
      const c = b?.children?.find((c) => c.path?.at(-1) === 'c');
      expect(c?.path).toEqual(['a', 'b', 'c']);
      expect(c?.type).toBe(DiffType.CHANGED);
    });

    test('should store array indices as strings in path', () => {
      const changed = diffRaw([10, 20], [10, 99]).children?.find(
        (c) => c.type === DiffType.CHANGED,
      );
      expect(changed?.path?.at(-1)).toBe('1');
    });

    // empty containers
    test('should treat two empty objects as unchanged', () => {
      expect(diffRaw({}, {}).type).toBe(DiffType.UNCHANGED);
    });

    test('should treat two empty arrays as unchanged', () => {
      expect(diffRaw([], []).type).toBe(DiffType.UNCHANGED);
    });

    test('should detect empty vs non-empty container as changed', () => {
      expect(diffRaw({}, { a: 1 }).type).toBe(DiffType.CHANGED);
      expect(diffRaw([1, 2], []).type).toBe(DiffType.CHANGED);
    });

    // array vs object mismatch (nested)
    test('should detect nested array vs object mismatch without children', () => {
      const x = diffRaw({ x: [1, 2] }, { x: { 0: 1, 1: 2 } }).children?.find(
        (c) => c.path?.at(-1) === 'x',
      );
      expect(x?.type).toBe(DiffType.CHANGED);
      expect(x?.children).toBeUndefined();
    });

    // ignoreKeys on nested objects
    test('should apply ignoreKeys at every depth level', () => {
      expect(
        diffRaw(
          { a: { ts: 1, val: 'x' } },
          { a: { ts: 2, val: 'x' } },
          { ignoreKeys: ['ts'] },
        ).type,
      ).toBe(DiffType.UNCHANGED);
    });

    test('should not suppress non-ignored key changes when using ignoreKeys', () => {
      expect(
        diffRaw(
          { a: { ts: 1, val: 'x' } },
          { a: { ts: 2, val: 'y' } },
          { ignoreKeys: ['ts'] },
        ).type,
      ).toBe(DiffType.CHANGED);
    });

    // ignoreValues preserves structural changes
    test('should still report ADDED keys when ignoreValues is true', () => {
      const bChange = diffRaw(
        { a: 1 },
        { a: 999, b: 2 },
        { ignoreValues: true },
      ).children?.find((c) => c.path?.at(-1) === 'b');
      expect(bChange?.type).toBe(DiffType.ADDED);
    });

    test('should still report REMOVED keys when ignoreValues is true', () => {
      const bChange = diffRaw(
        { a: 1, b: 2 },
        { a: 999 },
        { ignoreValues: true },
      ).children?.find((c) => c.path?.at(-1) === 'b');
      expect(bChange?.type).toBe(DiffType.REMOVED);
    });

    test('should report CHANGED for arrays of different lengths when ignoreValues is true', () => {
      expect(
        diffRaw(['a', 'b'], ['x', 'y', 'z'], { ignoreValues: true }).type,
      ).toBe(DiffType.CHANGED);
    });

    // keysOnly with arrays
    test('should treat same-length arrays with different values as unchanged when keysOnly', () => {
      expect(diffRaw([1, 2, 3], [4, 5, 6], { keysOnly: true }).type).toBe(
        DiffType.UNCHANGED,
      );
    });

    test('should detect different-length arrays as changed when keysOnly', () => {
      expect(diffRaw([1, 2], [1, 2, 3], { keysOnly: true }).type).toBe(
        DiffType.CHANGED,
      );
    });

    // keysOnly multi-level structural changes
    test('should detect removed nested key and added top-level key simultaneously with keysOnly', () => {
      const result = diffRaw(
        { a: 1, b: { c: 2, d: 3 } },
        { a: 100, b: { c: 200 }, e: 4 },
        { keysOnly: true },
      );
      expect(result.type).toBe(DiffType.CHANGED);
      expect(result.children?.find((c) => c.path?.at(-1) === 'e')?.type).toBe(
        DiffType.ADDED,
      );
      const b = result.children?.find((c) => c.path?.at(-1) === 'b');
      expect(b?.children?.find((c) => c.path?.at(-1) === 'd')?.type).toBe(
        DiffType.REMOVED,
      );
    });

    // arrays of objects
    test('should detect a changed field inside an array element', () => {
      const result = diffRaw(
        [{ id: 1, name: 'Alice' }],
        [{ id: 1, name: 'Bob' }],
      );
      const nameChange = result.children?.[0]?.children?.find(
        (c) => c.path?.at(-1) === 'name',
      );
      expect(nameChange?.type).toBe(DiffType.CHANGED);
      expect(nameChange?.oldValue).toBe('Alice');
      expect(nameChange?.newValue).toBe('Bob');
    });

    test('should detect an added field inside an array element', () => {
      const extraChange = diffRaw(
        [{ id: 1 }],
        [{ id: 1, extra: true }],
      ).children?.[0]?.children?.find((c) => c.path?.at(-1) === 'extra');
      expect(extraChange?.type).toBe(DiffType.ADDED);
    });

    // 4-level deep nesting
    test('should detect change at depth 4 and build full path', () => {
      const result = diffRaw(
        { profile: { contact: { address: { city: 'Anytown' } } } },
        { profile: { contact: { address: { city: 'Newtown' } } } },
      );
      const city = result.children
        ?.find((c) => c.path?.at(-1) === 'profile')
        ?.children?.find((c) => c.path?.at(-1) === 'contact')
        ?.children?.find((c) => c.path?.at(-1) === 'address')
        ?.children?.find((c) => c.path?.at(-1) === 'city');
      expect(city?.type).toBe(DiffType.CHANGED);
      expect(city?.path).toEqual(['profile', 'contact', 'address', 'city']);
    });

    // complete array-element replacement
    test('should detect all fields changed when an array element is replaced', () => {
      const elem = diffRaw(
        [{ id: 3, title: 'Third', author: 'charlie' }],
        [{ id: 4, title: 'New', author: 'dave' }],
      ).children?.[0];
      expect(elem?.children?.find((c) => c.path?.at(-1) === 'id')?.type).toBe(
        DiffType.CHANGED,
      );
      expect(
        elem?.children?.find((c) => c.path?.at(-1) === 'title')?.type,
      ).toBe(DiffType.CHANGED);
      expect(
        elem?.children?.find((c) => c.path?.at(-1) === 'author')?.type,
      ).toBe(DiffType.CHANGED);
    });

    // object with nested object and array as siblings
    test('should handle a nested object and array as siblings', () => {
      const result = diffRaw(
        { a: 1, b: { c: 2 }, d: [1, 2, 3] },
        { a: 1, b: { c: 3 }, d: [1, 2, 4] },
      );
      const c = result.children
        ?.find((c) => c.path?.at(-1) === 'b')
        ?.children?.find((c) => c.path?.at(-1) === 'c');
      expect(c?.oldValue).toBe(2);
      expect(c?.newValue).toBe(3);
      const elem2 = result.children
        ?.find((c) => c.path?.at(-1) === 'd')
        ?.children?.find((c) => c.path?.at(-1) === '2');
      expect(elem2?.oldValue).toBe(3);
      expect(elem2?.newValue).toBe(4);
    });

    // array of strings with Levenshtein changes
    test('should detect changed and unchanged string elements in an array', () => {
      const result = diffRaw(
        ['javascript', 'react', 'node', 'development'],
        ['javascript', 'react', 'node.js', 'web development'],
      );
      expect(result.children?.find((c) => c.path?.at(-1) === '0')?.type).toBe(
        DiffType.UNCHANGED,
      );
      expect(result.children?.find((c) => c.path?.at(-1) === '1')?.type).toBe(
        DiffType.UNCHANGED,
      );
      const elem2 = result.children?.find((c) => c.path?.at(-1) === '2');
      expect(elem2?.type).toBe(DiffType.CHANGED);
      expect(elem2?.meta?.levenDistance).toBeDefined();
    });

    // new top-level section added as object
    test('should mark a newly added object-valued key as ADDED', () => {
      const logging = diffRaw(
        { server: { port: 3000 } },
        { server: { port: 3000 }, logging: { level: 'info', format: 'json' } },
      ).children?.find((c) => c.path?.at(-1) === 'logging');
      expect(logging?.type).toBe(DiffType.ADDED);
      expect(logging?.newValue).toEqual({ level: 'info', format: 'json' });
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

    // withSimilarity formatting
    test('should show similarity percentage when withSimilarity is true', () => {
      const result = diff('hello world', 'hello there', {
        withSimilarity: true,
        color: false,
      });
      expect(result).toContain('% similar');
      expect(result).toContain("- 'hello world'");
      expect(result).toContain("+ 'hello there'");
    });

    test('should not show similarity percentage when withSimilarity is false', () => {
      expect(
        diff('hello world', 'hello there', { color: false }),
      ).not.toContain('% similar');
    });

    test('should show similarity percentage for a nested string change', () => {
      const result = diff(
        { msg: 'hello world' },
        { msg: 'hello there' },
        { withSimilarity: true, color: false },
      );
      expect(result).toContain('% similar');
      expect(result).toContain('msg:');
    });

    // ANSI color output
    test('should wrap added values in green ANSI codes by default', () => {
      const result = diff({ a: 1 }, { a: 1, b: 2 });
      expect(result).toContain('\x1b[32m');
      expect(result).toContain('\x1b[0m');
    });

    test('should wrap removed values in red ANSI codes by default', () => {
      expect(diff({ a: 1, b: 2 }, { a: 1 })).toContain('\x1b[31m');
    });

    test('should wrap unchanged values in gray ANSI codes when full is true', () => {
      expect(diff({ a: 1, b: 2 }, { a: 1, b: 3 }, { full: true })).toContain(
        '\x1b[90m',
      );
    });

    test('should produce no ANSI codes when color is false', () => {
      expect(diff({ a: 1 }, { a: 2 }, { color: false })).not.toContain('\x1b[');
    });

    // primitive type mismatches formatting
    test('should format number-to-string change with correct labels', () => {
      const result = diff({ id: 1 }, { id: '1' }, { color: false });
      expect(result).toContain('- id: 1');
      expect(result).toContain("+ id: '1'");
    });

    // empty containers
    test('should produce empty output for two empty objects', () => {
      expect(diff({}, {}, { color: false }).trim()).toBe('');
    });

    test('should produce empty output for identical non-empty objects', () => {
      expect(diff({ x: 1 }, { x: 1 }, { color: false }).trim()).toBe('');
    });

    // full option with arrays
    test('should show unchanged array elements when full is true', () => {
      const result = diff([1, 2, 3], [1, 2, 4], { full: true, color: false });
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('- 3');
      expect(result).toContain('+ 4');
    });

    test('should hide unchanged array elements by default', () => {
      const result = diff([1, 2, 3], [1, 2, 4], { color: false });
      expect(result).not.toMatch(/^\s+1$/m);
      expect(result).not.toMatch(/^\s+2$/m);
      expect(result).toContain('- 3');
      expect(result).toContain('+ 4');
    });

    // outputKeys edge cases
    test('should produce empty output when object is unchanged even with outputKeys', () => {
      expect(
        diff(
          { a: 1, b: 2 },
          { a: 1, b: 2 },
          { outputKeys: ['a'], color: false },
        ).trim(),
      ).toBe('');
    });

    test('should include an outputKey whose value is unchanged when another key changed', () => {
      const result = diff(
        { a: 1, b: 2 },
        { a: 1, b: 3 },
        { outputKeys: ['a'], color: false },
      );
      expect(result).toContain('  a: 1');
      expect(result).toContain('- b: 2');
      expect(result).toContain('+ b: 3');
    });

    test('should not output a non-existent outputKey', () => {
      expect(
        diff({ a: 1 }, { a: 2 }, { outputKeys: ['nonexistent'], color: false }),
      ).not.toContain('nonexistent');
    });

    test('should show outputKey sub-keys inside a changed section', () => {
      const result = diff(
        { app: { version: '1.0.0', environment: 'dev', debug: false } },
        { app: { version: '1.0.0', environment: 'dev', debug: true } },
        { outputKeys: ['version', 'environment'], color: false },
      );
      expect(result).toContain("  version: '1.0.0'");
      expect(result).toContain("  environment: 'dev'");
    });

    test('should not show outputKey when its parent section is fully unchanged', () => {
      const result = diff(
        { app: { version: '1.0.0' }, other: { x: 1 } },
        { app: { version: '1.0.0' }, other: { x: 2 } },
        { outputKeys: ['version'], color: false },
      );
      expect(result).not.toContain("version: '1.0.0'");
      expect(result).toContain('- x: 1');
      expect(result).toContain('+ x: 2');
    });

    // ignoreValues + full combined
    test('should show full tree with ignoreValues and full, marking only structural additions', () => {
      const result = diff(
        { a: 1, b: 2, c: { d: 3 } },
        { a: 999, b: 888, c: { d: 777, e: 555 } },
        { ignoreValues: true, full: true, color: false },
      );
      expect(result).not.toContain('+ a:');
      expect(result).not.toContain('- a:');
      expect(result).toContain('+ e:');
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('d');
    });

    test('should show no +/- lines when ignoreValues and full are both set and structure is identical', () => {
      const result = diff(
        { x: 1, y: 2 },
        { x: 9, y: 8 },
        { ignoreValues: true, full: true, color: false },
      );
      expect(result).not.toContain('+');
      expect(result).not.toContain('-');
    });

    // arrays of objects formatting
    test('should format a changed field inside an array-of-objects element', () => {
      const result = diff([{ status: 'off' }], [{ status: 'on' }], {
        color: false,
      });
      expect(result).toContain("- status: 'off'");
      expect(result).toContain("+ status: 'on'");
    });

    // 4-level deep nesting formatting
    test('should format 4-level deep changes', () => {
      const result = diff(
        {
          profile: { contact: { address: { city: 'Anytown', zip: '12345' } } },
        },
        {
          profile: { contact: { address: { city: 'Newtown', zip: '67890' } } },
        },
        { color: false },
      );
      expect(result).toContain("- city: 'Anytown'");
      expect(result).toContain("+ city: 'Newtown'");
      expect(result).toContain("- zip: '12345'");
      expect(result).toContain("+ zip: '67890'");
    });

    // complete array-element replacement formatting
    test('should format a completely replaced array element', () => {
      const result = diff(
        [{ id: 3, author: 'charlie' }],
        [{ id: 4, author: 'dave' }],
        { color: false },
      );
      expect(result).toContain('- id: 3');
      expect(result).toContain('+ id: 4');
      expect(result).toContain("- author: 'charlie'");
      expect(result).toContain("+ author: 'dave'");
    });

    // object with nested object and array as siblings formatting
    test('should format a nested object and array sibling changes', () => {
      const result = diff(
        { b: { c: 2 }, d: [1, 2, 3] },
        { b: { c: 3 }, d: [1, 2, 4] },
        { color: false },
      );
      expect(result).toContain('- c: 2');
      expect(result).toContain('+ c: 3');
      expect(result).toContain('- 3');
      expect(result).toContain('+ 4');
    });

    test('should not show unchanged sibling key without full option', () => {
      const result = diff(
        { a: 1, b: { c: 2 } },
        { a: 1, b: { c: 3 } },
        { color: false },
      );
      expect(result).not.toContain('  a: 1');
    });

    // array of strings with Levenshtein changes formatting
    test('should format changed string array elements', () => {
      const result = diff(['javascript', 'node'], ['javascript', 'node.js'], {
        color: false,
      });
      expect(result).toContain("- 'node'");
      expect(result).toContain("+ 'node.js'");
    });

    // new top-level section added
    test('should show a newly added nested section', () => {
      const result = diff(
        { metrics: { enabled: false } },
        { metrics: { enabled: true, provider: 'prometheus' } },
        { color: false },
      );
      expect(result).toContain('+ provider:');
    });

    // nested arrays within objects
    test('should format a changed nested array within an object', () => {
      const result = diff(
        { items: [1, 2, 3] },
        { items: [1, 2, 4] },
        { color: false },
      );
      expect(result).toContain('- 3');
      expect(result).toContain('+ 4');
      expect(result).toContain('items:');
    });

    test('should produce empty output for identical nested arrays', () => {
      expect(
        diff(
          { items: [1, 2, 3] },
          { items: [1, 2, 3] },
          { color: false },
        ).trim(),
      ).toBe('');
    });

    // single-element edge cases
    test('should format a single-key object change', () => {
      const result = diff({ x: 'a' }, { x: 'b' }, { color: false });
      expect(result).toContain("- x: 'a'");
      expect(result).toContain("+ x: 'b'");
    });

    test('should format a single-element array change', () => {
      const result = diff([42], [99], { color: false });
      expect(result).toContain('- 42');
      expect(result).toContain('+ 99');
    });

    test('should produce empty output for an unchanged single-element array', () => {
      expect(diff([42], [42], { color: false }).trim()).toBe('');
    });
  });
});
