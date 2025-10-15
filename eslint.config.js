// @ts-check
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
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
          jsx: true
        }
      },
      globals: globals.browser
    }
  },
  {
    ignores: ['src-tauri/**/*', 'dist/**/*']
  },
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactRefresh.configs.recommended,
  reactHooks.configs.flat['recommended-latest'], // Official React team rules
  {
    plugins: {
      reactPlugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_' }
      ],
      'react-refresh/only-export-components': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
])
