// @ts-check
import eslintReact from '@eslint-react/eslint-plugin'
import pluginRouter from '@tanstack/eslint-plugin-router'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: globals.browser,
    },
  },
  {
    ignores: ['src-tauri/**/*', 'dist/**/*'],
  },
  {
    ...eslintReact.configs['recommended-typescript'],
    files: ['**/*.{jsx,tsx}'],
    rules: {
      ...eslintReact.configs['recommended-typescript'].rules,
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/use-memo': 'off',
    },
  },
  reactRefresh.configs.vite({
    extraHOCs: [
      'createFileRoute',
      'createLazyFileRoute',
      'createRootRoute',
      'createRootRouteWithContext',
      'createLink',
      'createRoute',
      'createLazyRoute',
    ],
  }),
  reactHooks.configs.flat['recommended-latest'], // Official React team rules
  ...pluginRouter.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_' },
      ],
      'react-refresh/only-export-components': 'warn',
    },
  },
])
