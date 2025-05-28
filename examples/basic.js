// Examples for diff-leven

// Import the library
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { diff, diffRaw, isDiff } = require('../dist');

// ==========================================
// Basic Usage Examples
// ==========================================

// Simple object diff
const obj1 = { foo: 'bar', count: 42 };
const obj2 = { foo: 'baz', count: 42 };

console.log('=== Object diff ===');
console.log(diff(obj1, obj2));

// Array diff
const arr1 = [1, 2, 3, 4];
const arr2 = [1, 2, 5, 4];

console.log('\n=== Array diff ===');
console.log(diff(arr1, arr2));

// Nested object diff
const nested1 = {
  user: {
    name: 'Alice',
    details: {
      age: 30,
      location: 'New York',
    },
  },
};

const nested2 = {
  user: {
    name: 'Alice',
    details: {
      age: 31,
      location: 'Boston',
    },
  },
};

console.log('\n=== Nested object diff ===');
console.log(diff(nested1, nested2));

// ==========================================
// Option Examples
// ==========================================

// Using keysOnly option - only compare object structure, ignoring values
const structure1 = { a: 1, b: { c: 2, d: 3 } };
const structure2 = { a: 100, b: { c: 200 }, e: 4 };

console.log('\n=== Keys only diff ===');
console.log(diff(structure1, structure2, { keysOnly: true }));

// Using full option - show the entire object tree, not just differences
console.log('\n=== Full output diff ===');
console.log(diff(obj1, obj2, { full: true }));

// Using outputKeys option - always include specified keys in output for objects with differences
console.log('\n=== Output specific keys ===');
console.log(diff(obj1, obj2, { outputKeys: ['count'] }));

// Using ignoreKeys option (new) - skip specified keys when comparing objects
const userData1 = { name: 'John', age: 30, timestamp: Date.now() };
const userData2 = { name: 'Jane', age: 25, timestamp: Date.now() + 1000 };

console.log('\n=== Ignore keys diff ===');
console.log(diff(userData1, userData2, { ignoreKeys: ['timestamp'] }));

// Using ignoreValues with structural differences
const struct1 = { a: 1, b: 2, c: { d: 3 } };
const struct2 = { a: 999, b: 888, c: { d: 777, e: 555 } };

console.log('\n=== Ignore values with structural diff ===');
console.log(diff(struct1, struct2, { ignoreValues: true }));

// Using ignoreValues with full option to show complete structure
console.log('\n=== Ignore values with full option ===');
console.log(diff(struct1, struct2, { ignoreValues: true, full: true }));

// Arrays with ignoreValues
const arr3 = [1, 2, 3];
const arr4 = [9, 8, 7, 6];

console.log('\n=== Array with ignoreValues ===');
console.log(diff(arr3, arr4, { ignoreValues: true }));

// Combining multiple options
console.log('\n=== Combined options diff ===');
console.log(
  diff(userData1, userData2, {
    ignoreKeys: ['timestamp'],
    outputKeys: ['name'],
    color: false,
  }),
);

// Raw diff output (JavaScript object instead of formatted string)
console.log('\n=== Raw diff output ===');
console.log(JSON.stringify(diffRaw(obj1, obj2), null, 2));

// ==========================================
// Real-world Examples
// ==========================================

// Configuration file comparison (ignoring sensitive values)
const config1 = {
  server: {
    port: 3000,
    host: 'localhost',
    credentials: {
      username: 'admin',
      password: 'secret123',
    },
  },
  database: {
    url: 'mongodb://localhost:27017',
    name: 'myapp',
  },
};

const config2 = {
  server: {
    port: 8080,
    host: 'localhost',
    credentials: {
      username: 'admin',
      password: 'different-secret',
    },
  },
  database: {
    url: 'mongodb://localhost:27017',
    name: 'myapp-dev',
  },
};

console.log('\n=== Configuration comparison (ignoring credentials) ===');
console.log(
  diff(config1, config2, {
    ignoreKeys: ['password', 'username'],
  }),
);

// ==========================================
// isDiff Boolean Check Examples
// ==========================================

console.log('\n=== isDiff Basic Usage ===');
// Simple identical check
console.log(
  'Simple check (identical):',
  isDiff({ a: 1, b: 2 }, { a: 1, b: 2 }),
);
// Simple different check
console.log(
  'Simple check (different):',
  isDiff({ a: 1, b: 2 }, { a: 1, b: 3 }),
);

// With ignoreKeys option
const user1 = { id: 123, name: 'John', lastLogin: Date.now() };
const user2 = { id: 123, name: 'John', lastLogin: Date.now() + 1000 };
console.log(
  'With ignoreKeys (should be false):',
  isDiff(user1, user2, { ignoreKeys: ['lastLogin'] }),
);

// With keysOnly option - only structure matters
const form1 = { name: 'John', email: 'john@example.com', age: 30 };
const form2 = { name: 'Jane', email: 'jane@example.com', age: 25 };
console.log(
  'With keysOnly (should be false):',
  isDiff(form1, form2, { keysOnly: true }),
);

// With ignoreValues option - only structure matters
console.log(
  'With ignoreValues on equal objects (should be false):',
  isDiff(form1, form2, { ignoreValues: true }),
);

// With ignoreValues but different structure
const form3 = { name: 'John', email: 'john@example.com', age: 30 };
const form4 = {
  name: 'Jane',
  email: 'jane@example.com',
  address: '123 Main St',
};
console.log(
  'With ignoreValues but different keys (should be true):',
  isDiff(form3, form4, { ignoreValues: true }),
);

// Complex nested example
const userProfile1 = {
  id: 123,
  name: 'User',
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      push: false,
    },
  },
  history: [1, 2, 3],
};

const userProfile2 = {
  id: 123,
  name: 'User',
  preferences: {
    theme: 'light', // changed
    notifications: {
      email: true,
      push: false,
    },
  },
  history: [1, 2, 3],
};

console.log(
  'Complex nested objects (should be true):',
  isDiff(userProfile1, userProfile2),
);
console.log(
  'Complex with ignoreKeys (should be false):',
  isDiff(userProfile1, userProfile2, { ignoreKeys: ['theme'] }),
);
