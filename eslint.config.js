import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import js from '@eslint/js'

export default defineConfig([
  globalIgnores(['node_modules/', 'dist/', 'web/', 'generated/']),
  {
    files: ['**/*.ts'],
    plugins: { js },
    extends: ['js/recommended']
  },
  tseslint.configs.recommended,
  {
    rules: {
      'no-async-promise-executor': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])
