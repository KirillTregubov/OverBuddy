// @ts-check
import eslint from '@eslint/js'
import react from 'eslint-plugin-react'
import reactCompiler from 'eslint-plugin-react-compiler'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxRuntimeConfig from 'eslint-plugin-react/configs/jsx-runtime.js'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: globals.browser
    }
  },

  {
    ignores: ['src-tauri/**/*', 'dist/**/*']
  },

  reactRecommended,
  jsxRuntimeConfig,

  reactHooks.configs['recommended-latest'],
  reactRefresh.configs['recommended'],

  {
    plugins: {
      react,
      'react-compiler': reactCompiler
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_' }
      ],
      'react-refresh/only-export-components': 'warn',
      'react-compiler/react-compiler': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
)
