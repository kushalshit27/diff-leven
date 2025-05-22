import { describe, expect, test } from 'vitest';
import { diffRaw, diff } from '../src';
import fs from 'fs';
import path from 'path';

describe('diff-leven e2e tests', () => {
  // Test full workflow with complex nested objects
  test('should generate accurate diffs for complex nested objects and verify formatting', () => {
    const object1 = {
      user: {
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
        permissions: ['read', 'write'],
        metadata: {
          lastLogin: '2023-05-10',
          loginCount: 42,
        },
      },
      app: {
        version: '1.0.0',
        features: ['search', 'export', 'import'],
        settings: {
          cache: true,
          timeout: 30000,
        },
      },
    };

    const object2 = {
      user: {
        profile: {
          name: 'John Doe',
          email: 'john.doe@example.com', // Changed email
          preferences: {
            theme: 'light', // Changed theme
            notifications: {
              email: true,
              push: true, // Changed push notification setting
              sms: false, // Added new notification channel
            },
          },
        },
        permissions: ['read', 'write', 'admin'], // Added permission
        metadata: {
          lastLogin: '2023-06-15', // Updated date
          loginCount: 43, // Incremented count
        },
      },
      app: {
        version: '1.1.0', // Version bump
        features: ['search', 'export', 'import', 'share'], // Added feature
        settings: {
          cache: true,
          timeout: 60000, // Increased timeout
        },
      },
    };

    // Step 1: Generate raw diff and verify structure
    const rawDiff = diffRaw(object1, object2);
    expect(rawDiff.type).toBe('changed');

    // Verify user profile changes
    const userChange = rawDiff.children?.find((c) => c.path?.at(-1) === 'user');
    expect(userChange?.type).toBe('changed');

    const profileChange = userChange?.children?.find(
      (c) => c.path?.at(-1) === 'profile',
    );
    expect(profileChange?.type).toBe('changed');

    const emailChange = profileChange?.children?.find(
      (c) => c.path?.at(-1) === 'email',
    );
    expect(emailChange?.type).toBe('changed');
    expect(emailChange?.oldValue).toBe('john@example.com');
    expect(emailChange?.newValue).toBe('john.doe@example.com');

    // Verify theme change
    const preferencesChange = profileChange?.children?.find(
      (c) => c.path?.at(-1) === 'preferences',
    );
    const themeChange = preferencesChange?.children?.find(
      (c) => c.path?.at(-1) === 'theme',
    );
    expect(themeChange?.type).toBe('changed');
    expect(themeChange?.oldValue).toBe('dark');
    expect(themeChange?.newValue).toBe('light');

    // Verify notifications change (added SMS field)
    const notificationsChange = preferencesChange?.children?.find(
      (c) => c.path?.at(-1) === 'notifications',
    );
    const smsChange = notificationsChange?.children?.find(
      (c) => c.path?.at(-1) === 'sms',
    );
    expect(smsChange?.type).toBe('added');
    expect(smsChange?.newValue).toBe(false);

    // Step 2: Test formatted diff with different options
    const formattedDiff = diff(object1, object2, { color: false });
    expect(formattedDiff).toContain("- email: 'john@example.com'");
    expect(formattedDiff).toContain("+ email: 'john.doe@example.com'");
    expect(formattedDiff).toContain("- theme: 'dark'");
    expect(formattedDiff).toContain("+ theme: 'light'");
    expect(formattedDiff).toContain('+ sms: false');
    expect(formattedDiff).toContain("- version: '1.0.0'");
    expect(formattedDiff).toContain("+ version: '1.1.0'");

    // Step 3: Test ignoreKeys option
    const diffIgnoringVersion = diff(object1, object2, {
      ignoreKeys: ['version', 'lastLogin'],
      color: false,
    });
    expect(diffIgnoringVersion).not.toContain("version: '1.0.0'");
    expect(diffIgnoringVersion).not.toContain("version: '1.1.0'");
    expect(diffIgnoringVersion).not.toContain('lastLogin');

    // Step 4: Test outputKeys option
    const diffWithOutputKeys = diff(object1, object2, {
      outputKeys: ['name'],
      color: false,
    });
    expect(diffWithOutputKeys).toContain("  name: 'John Doe'");

    // Step 5: Test full option
    const fullDiff = diff(object1, object2, {
      full: true,
      color: false,
    });
    expect(fullDiff).toContain("  name: 'John Doe'"); // Unchanged value is shown
  });

  // Test real-world use case: Comparing configuration files
  test('should handle real-world configuration comparison use case', () => {
    const config1 = {
      server: {
        host: 'localhost',
        port: 3000,
        ssl: false,
      },
      database: {
        url: 'mongodb://localhost:27017',
        name: 'testdb',
        user: 'dbuser',
        password: 'secret123',
      },
      auth: {
        provider: 'local',
        jwtSecret: 'supersecretkey',
        tokenExpiry: '1h',
      },
      logging: {
        level: 'info',
        file: './logs/app.log',
      },
    };

    const config2 = {
      server: {
        host: 'localhost',
        port: 8080, // Changed
        ssl: true, // Changed
      },
      database: {
        url: 'mongodb://mongodb.example.com:27017', // Changed
        name: 'proddb', // Changed
        user: 'produser', // Changed
        password: 'differentpassword', // Changed
        pool: {
          // Added
          min: 5,
          max: 20,
        },
      },
      auth: {
        provider: 'oauth2', // Changed
        jwtSecret: 'differentsecretkey', // Changed
        tokenExpiry: '24h', // Changed
        refreshToken: true, // Added
      },
      logging: {
        level: 'error', // Changed
        file: './logs/app.log',
      },
      cache: {
        // Added entire section
        enabled: true,
        provider: 'redis',
        ttl: 3600,
      },
    };

    // Test ignoring sensitive information
    const sensitiveKeys = ['password', 'jwtSecret'];
    const secureDiff = diff(config1, config2, {
      ignoreKeys: sensitiveKeys,
      color: false,
    });

    expect(secureDiff).not.toContain('secret123');
    expect(secureDiff).not.toContain('supersecretkey');
    expect(secureDiff).not.toContain('differentsecretkey');

    // But should still show other changes
    expect(secureDiff).toContain('port: 3000');
    expect(secureDiff).toContain('port: 8080');
    expect(secureDiff).toContain('ssl: false');
    expect(secureDiff).toContain('ssl: true');

    // Test structure-only diff (ignoring values)
    const structureDiff = diff(config1, config2, {
      ignoreValues: true,
      full: true,
      color: false,
    });

    expect(structureDiff).toContain('pool');
    expect(structureDiff).toContain('min');
    expect(structureDiff).toContain('max');
    expect(structureDiff).toContain('cache');
    expect(structureDiff).toContain('enabled');
    expect(structureDiff).toContain('provider');
    expect(structureDiff).toContain('ttl');
    expect(structureDiff).toContain('refreshToken');
  });

  // Test end-to-end workflow with files
  test('should perform diff workflow with file-based inputs and outputs', () => {
    // Step 1: Create temp file paths
    const tempDir = path.join(process.cwd(), 'test', 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const objFile1 = path.join(tempDir, 'object1.json');
    const objFile2 = path.join(tempDir, 'object2.json');
    const diffOutputFile = path.join(tempDir, 'diff-output.txt');

    // Step 2: Create test objects
    const obj1 = {
      settings: {
        theme: 'dark',
        fontSize: 14,
        features: ['sidebar', 'toolbar', 'statusbar'],
        window: {
          width: 1200,
          height: 800,
          position: 'center',
        },
      },
      recent: [
        '/home/user/doc1.txt',
        '/home/user/doc2.txt',
        '/home/user/projects/project1',
      ],
      user: {
        id: 'user123',
        name: 'Test User',
        email: 'user@example.com',
      },
    };

    const obj2 = {
      settings: {
        theme: 'light',
        fontSize: 16,
        features: ['sidebar', 'toolbar', 'statusbar', 'minimap'],
        window: {
          width: 1600,
          height: 900,
          position: 'left',
        },
      },
      recent: [
        '/home/user/doc3.txt',
        '/home/user/projects/project1',
        '/home/user/projects/project2',
      ],
      user: {
        id: 'user123',
        name: 'Test User',
        email: 'user.updated@example.com',
      },
    };

    // Step 3: Write to files
    fs.writeFileSync(objFile1, JSON.stringify(obj1, null, 2));
    fs.writeFileSync(objFile2, JSON.stringify(obj2, null, 2));

    // Step 4: Read from files and perform diff
    const readObj1 = JSON.parse(fs.readFileSync(objFile1, 'utf-8'));
    const readObj2 = JSON.parse(fs.readFileSync(objFile2, 'utf-8'));

    const diffResult = diff(readObj1, readObj2, { color: false });

    // Step 5: Write diff to output file
    fs.writeFileSync(diffOutputFile, diffResult);

    // Step 6: Verify diff content
    const diffContent = fs.readFileSync(diffOutputFile, 'utf-8');
    expect(diffContent).toContain("- theme: 'dark'");
    expect(diffContent).toContain("+ theme: 'light'");
    expect(diffContent).toContain('- fontSize: 14');
    expect(diffContent).toContain('+ fontSize: 16');
    expect(diffContent).toContain("+ 'minimap'");

    // Step 7: Clean up temp files
    fs.unlinkSync(objFile1);
    fs.unlinkSync(objFile2);
    fs.unlinkSync(diffOutputFile);
    fs.rmdirSync(tempDir);
  });

  // Test realistic string comparison scenario
  test('should accurately compare similar text content with Levenshtein distance', () => {
    const text1 = `# Project Setup Guide

    ## Prerequisites
    - Node.js v14 or higher
    - npm v7 or higher
    - MongoDB v4.4

    ## Installation
    1. Clone the repository
    2. Run \`npm install\`
    3. Configure environment variables
    4. Start the development server with \`npm run dev\`

    ## Configuration
    Create a .env file with the following variables:
    - PORT=3000
    - DB_URI=mongodb://localhost:27017/myapp
    - JWT_SECRET=your_secret_key

    ## Testing
    Run tests with \`npm test\``;

    const text2 = `# Project Setup Guide

    ## Prerequisites
    - Node.js v16 or higher
    - npm v8 or higher
    - MongoDB v5.0

    ## Installation
    1. Clone the repository
    2. Run \`npm install\`
    3. Configure environment variables in the .env file
    4. Start the development server with \`npm run start:dev\`

    ## Configuration
    Create a .env file with the following variables:
    - PORT=8080
    - DATABASE_URI=mongodb://localhost:27017/myapp
    - JWT_SECRET=your_secret_key
    - API_KEY=optional_api_key

    ## Testing
    Run tests with \`npm test\`
    Run specific tests with \`npm test -- --grep="pattern"\``;

    // Test raw diff
    const rawTextDiff = diffRaw(text1, text2);
    expect(rawTextDiff.type).toBe('changed');
    expect(rawTextDiff.meta?.levenDistance).toBeDefined();
    expect(rawTextDiff.meta?.similarity).toBeDefined();
    expect(rawTextDiff.meta?.similarity).toBeGreaterThan(0.5); // Texts are similar

    // Test formatted diff
    const textDiff = diff(text1, text2, { color: false });

    // When comparing multiline strings, the library shows the entire string
    // rather than individual lines, so we need to check for the whole content
    expect(textDiff).toContain("- '# Project Setup Guide");
    expect(textDiff).toContain("+ '# Project Setup Guide");
    expect(textDiff).toContain('PORT=3000');
    expect(textDiff).toContain('PORT=8080');
  });
});
