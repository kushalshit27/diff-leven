import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig({
  // Apply TypeScript ESLint recommended rules only to .ts and .js files
  files: ['**/*.ts', '**/*.js'],
  extends: [tseslint.configs.recommended],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
  },
});
