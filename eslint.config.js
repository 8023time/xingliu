// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'eslint.config.mjs',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/.next/**',
    '**/out/**',
    '**/.turbo/**',
    '**/.cache/**',
    '**/*.tsbuildinfo',
    'apps/**',
    'apps/web/next-env.d.ts',
  ]),

  {
    name: 'linter options',
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },

  {
    name: 'node globals',
    files: [
      '*.config.{js,mjs,cjs,ts,mts,cts}',
      'eslint.config.js',
      'commitlint.config.cjs',
      'server/**/*.{js,mjs,cjs,ts,mts,cts}',
      'packages/**/*.{js,mjs,cjs,ts,mts,cts}',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    name: 'test globals',
    files: ['**/*.{spec,test}.{js,mjs,cjs,jsx,ts,mts,cts,tsx}', 'server/test/**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },

  {
    name: 'javascript',
    files: ['**/*.{js,mjs,cjs,jsx}'],
    extends: [
      eslint.configs.recommended,
      {
        ...eslintPluginPrettierRecommended,
        rules: {
          ...eslintPluginPrettierRecommended.rules,
          'prettier/prettier': ['error', { endOfLine: 'auto' }],
        },
      },
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    name: 'commonjs',
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },

  {
    name: 'typescript',
    files: ['**/*.{ts,mts,cts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      {
        ...eslintPluginPrettierRecommended,
        rules: {
          ...eslintPluginPrettierRecommended.rules,
          'prettier/prettier': ['error', { endOfLine: 'auto' }],
        },
      },
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    name: 'typescript type checked',
    files: ['server/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },

  {
    name: 'test rule relaxations',
    files: ['**/*.{spec,test}.{js,mjs,cjs,jsx,ts,mts,cts,tsx}', 'server/test/**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]);
