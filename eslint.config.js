import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import eslint from '@eslint/js'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import pluginsJSXRuntime from 'eslint-plugin-react/configs/jsx-runtime.js'
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { files: ['**/*.{ts,tsx}'] },
  { ignores: ['src-tauri/**/*', 'dist/**/*'] },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: globals.browser } },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  ...fixupConfigRules(pluginsJSXRuntime),
  {
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': fixupPluginRules(eslintPluginReactHooks)
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
      ...eslintPluginReactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_' }
      ]
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
