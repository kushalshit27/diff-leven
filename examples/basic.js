// Examples for diff-leven

// Import the library
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { diff, diffString } = require('../dist');

// ==========================================
// Basic Usage Examples
// ==========================================

// Simple object 1 diff
const obj1 = { foo: 'bar', count: 42 };
const obj2 = { foo: 'baz', count: 42 };

console.log('=== Object diff ===');
console.log(diffString(obj1, obj2));

// Simple object 2 diff full
const obj3 = { foo: 'bar', count: 42 };
const obj4 = { foo: 'baz', count: 42 };

console.log('=== Object diff full ===');
console.log(diffString(obj3, obj4, { full: true }));

// Array diff
const arr1 = [1, 2, 3, 4];
const arr2 = [1, 2, 5, 4];

console.log('\n=== Array diff ===');
console.log(diffString(arr1, arr2));

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
console.log(diffString(nested1, nested2));

// ==========================================
// Option Examples
// ==========================================

// Using keysOnly option - only compare object structure, ignoring values
const structure1 = { a: 1, b: { c: 2, d: 3 } };
const structure2 = { a: 100, b: { c: 200 }, e: 4 };

console.log('\n=== Keys only diff ===');
console.log(diffString(structure1, structure2, { keysOnly: true }));

// Using full option - show the entire object tree, not just differences
console.log('\n=== Full output diff ===');
console.log(diffString(obj1, obj2, { full: true }));

// Using outputKeys option - always include specified keys in output for objects with differences
console.log('\n=== Output specific keys ===');
console.log(diffString(obj1, obj2, { outputKeys: ['count'] }));

// Using ignoreKeys option (new) - skip specified keys when comparing objects
const userData1 = { name: 'John', age: 30, timestamp: Date.now() };
const userData2 = { name: 'Jane', age: 25, timestamp: Date.now() + 1000 };

console.log('\n=== Ignore keys diff ===');
console.log(diffString(userData1, userData2, { ignoreKeys: ['timestamp'] }));

// Using ignoreValues option (new) - ignore differences in values, focus only on structure
console.log('\n=== Ignore values diff ===');
console.log(diffString(userData1, userData2, { ignoreValues: true }));

// Combining multiple options
console.log('\n=== Combined options diff ===');
console.log(
  diffString(userData1, userData2, {
    ignoreKeys: ['timestamp'],
    outputKeys: ['name'],
    color: false,
  }),
);

// Raw diff output (JavaScript object instead of formatted string)
console.log('\n=== Raw diff output ===');
console.log(JSON.stringify(diff(obj1, obj2), null, 2));

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
  diffString(config1, config2, {
    ignoreKeys: ['password', 'username'],
  }),
);
