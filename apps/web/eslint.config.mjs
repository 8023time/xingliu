import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'eslint.config.mjs', 'next.config.ts']),
  {
    files: ['src/**/*.{ts,tsx}'],
    ...nextVitals[0],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ...nextTs[0],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);

export default eslintConfig;
