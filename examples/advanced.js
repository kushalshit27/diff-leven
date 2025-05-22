// Advanced examples for diff-leven

// Import the library
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { diff, diffRaw } = require('../dist');

// Example 1: Complex nested objects
console.log('=== Complex Nested Objects ===');

const user1 = {
  profile: {
    name: {
      first: 'John',
      last: 'Doe',
    },
    contact: {
      email: 'john@example.com',
      phone: '555-1234',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        zip: '12345',
        country: 'USA',
      },
    },
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        sms: true,
      },
    },
  },
  activity: {
    lastLogin: '2023-01-01',
    visits: 42,
    status: 'active',
  },
};

const user2 = {
  profile: {
    name: {
      first: 'John',
      last: 'Smith',
    },
    contact: {
      email: 'john.smith@example.com',
      phone: '555-1234',
      address: {
        street: '456 Oak Ave',
        city: 'Newtown',
        zip: '67890',
        country: 'USA',
      },
    },
    settings: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
  activity: {
    lastLogin: '2023-06-15',
    visits: 57,
    status: 'active',
  },
};

console.log(diff(user1, user2));

// Example 2: Working with arrays of objects
console.log('\n=== Arrays of Objects ===');

const posts1 = [
  { id: 1, title: 'First Post', likes: 10, author: 'alice' },
  { id: 2, title: 'Second Post', likes: 5, author: 'bob' },
  { id: 3, title: 'Third Post', likes: 8, author: 'charlie' },
];

const posts2 = [
  { id: 1, title: 'First Post', likes: 15, author: 'alice' }, // likes changed
  { id: 2, title: 'Updated Second Post', likes: 5, author: 'bob' }, // title changed
  { id: 4, title: 'New Post', likes: 0, author: 'dave' }, // completely different
];

console.log(diff(posts1, posts2));

// Example 3: Combining multiple options
console.log('\n=== Combining Multiple Options ===');

const config1 = {
  app: {
    name: 'MyApp',
    version: '1.0.0',
    environment: 'development',
  },
  server: {
    host: 'localhost',
    port: 3000,
    ssl: false,
    timeout: 30000,
  },
  database: {
    host: 'db.example.com',
    port: 5432,
    name: 'myapp_dev',
    user: 'admin',
    password: 'super_secret_password',
    timeout: 5000,
    poolSize: 10,
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
  metrics: {
    enabled: false,
  },
};

const config2 = {
  app: {
    name: 'MyApp',
    version: '1.1.0',
    environment: 'staging',
  },
  server: {
    host: 'app-server.example.com',
    port: 8080,
    ssl: true,
    timeout: 30000,
  },
  database: {
    host: 'db-read.example.com',
    port: 5432,
    name: 'myapp_staging',
    user: 'app_service',
    password: 'different_password',
    timeout: 10000,
    poolSize: 20,
  },
  cache: {
    enabled: true,
    ttl: 7200,
    provider: 'redis',
  },
  metrics: {
    enabled: true,
    provider: 'prometheus',
  },
  logging: {
    level: 'info',
    format: 'json',
  },
};

// Complex options example - hide sensitive info, focus on structure changes,
// always show version and environment fields
console.log(
  diff(config1, config2, {
    ignoreKeys: ['password', 'user'], // Don't compare these sensitive fields
    outputKeys: ['version', 'environment'], // Always include these fields
    color: true, // Use colors
  }),
);

// Example 4: Raw diff output (not string formatted)
console.log('\n=== Raw Diff Output ===');
const rawDiff = diffRaw(
  { a: 1, b: { c: 2 }, d: [1, 2, 3] },
  { a: 1, b: { c: 3 }, d: [1, 2, 4] },
);
console.log(JSON.stringify(rawDiff, null, 2));

// Example 5: String comparison with Levenshtein distance
console.log('\n=== Levenshtein String Comparison ===');
const string1 = 'The quick brown fox jumps over the lazy dog';
const string2 = 'The quick brown fox jumped over a lazy dog';
console.log(diff(string1, string2));

// Similar strings example
const title1 = 'Introduction to JavaScript Programming';
const title2 = 'Introduction to JavaScript Development';
console.log('\n=== Similar Strings ===');
console.log(diff(title1, title2));

// Array of similar strings
const keywords1 = ['javascript', 'react', 'node', 'development'];
const keywords2 = ['javascript', 'react', 'node.js', 'web development'];
console.log('\n=== Array of Similar Strings ===');
console.log(diff(keywords1, keywords2));
