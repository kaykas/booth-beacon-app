import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      // Build outputs
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',

      // Dependencies
      'node_modules/**',

      // Development and test scripts
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      'scripts/**/*.ts',

      // Root-level utility scripts
      '*.mjs',
      'run-*.mjs',
      'fix-*.mjs',
      'deploy-*.mjs',
      'deploy-*.sh',
      'test-*.sh',

      // Supabase
      'supabase/.temp/**',

      // Other
      '.vercel/**',
      'coverage/**',
      '.claude/**',
    ],
  },
];
