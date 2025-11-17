import { defineConfig, globalIgnores } from 'eslint/config'
import svelte from 'eslint-plugin-svelte'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import js from '@eslint/js'

export default defineConfig([
  globalIgnores(['node_modules/', 'build/', '.svelte-kit/', 'android/']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser }
  },
  tseslint.configs.recommended,
  svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])
