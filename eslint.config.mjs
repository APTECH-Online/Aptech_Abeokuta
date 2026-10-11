import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * ESLint flat config. `next lint` was removed in Next 16, so linting runs
 * through the ESLint CLI (`npm run lint`).
 *
 * The rules below are downgraded from error to warning because they flag
 * long-standing patterns in the existing code base (untyped Supabase rows,
 * state set inside effects, plain <img> tags). They stay visible without
 * blocking CI; tighten them as the code is cleaned up.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'node_modules/**', 'out/**', 'coverage/**', 'next-env.d.ts', 'scripts/**', 'public/**']),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@next/next/no-img-element': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/static-components': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
      '@next/next/no-html-link-for-pages': 'warn'
    }
  }
  ,
  {
    // CommonJS files loaded by Next's config (next.config.js, lib/security-headers.js).
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  }
])
