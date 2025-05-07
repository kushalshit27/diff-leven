// Examples for diff-leven

// Import the library
const diffLeven = require('../dist');

// Simple object diff
const obj1 = { foo: 'bar', count: 42 };
const obj2 = { foo: 'baz', count: 42 };

console.log('=== Object diff ===');
console.log(diffLeven.diffString(obj1, obj2));

// Array diff
const arr1 = [1, 2, 3, 4];
const arr2 = [1, 2, 5, 4];

console.log('\n=== Array diff ===');
console.log(diffLeven.diffString(arr1, arr2));

// Nested object diff
const nested1 = {
  user: {
    name: 'Alice',
    details: {
      age: 30,
      location: 'New York'
    }
  }
};

const nested2 = {
  user: {
    name: 'Alice',
    details: {
      age: 31,
      location: 'Boston'
    }
  }
};

console.log('\n=== Nested object diff ===');
console.log(diffLeven.diffString(nested1, nested2));

// Using keysOnly option
const structure1 = { a: 1, b: { c: 2, d: 3 } };
const structure2 = { a: 100, b: { c: 200 }, e: 4 };

console.log('\n=== Keys only diff ===');
console.log(diffLeven.diffString(structure1, structure2, { keysOnly: true }));

// Using full option
console.log('\n=== Full output diff ===');
console.log(diffLeven.diffString(obj1, obj2, { full: true }));

// Using outputKeys option
console.log('\n=== Output specific keys ===');
console.log(diffLeven.diffString(obj1, obj2, { outputKeys: ['count'] }));

// Raw diff output
console.log('\n=== Raw diff output ===');
console.log(JSON.stringify(diffLeven.diff(obj1, obj2), null, 2));
