import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
// import reactPlugin from 'eslint-plugin-react';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    '**/commitlint.config.js', // 忽略所有目录下的 commitlint 配置
    '**/eslint.config.js', // 忽略所有目录下的 eslint 配置
    'packages/*/eslint-config.js', // 忽略公共包内的 eslint 配置
    'packages/prettier-config/*.js', // 忽略公共包内的 eslint 配置
  ]),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierConfig,
      // reactPlugin.configs.flat.recommended,
    ],

    plugins: {
      prettier: prettierPlugin,
      rules: {
        'prettier/prettier': 'error',
      },
    },

    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        allowDefaultProject: true,
      },
    },

    rules: {
      // 只允许最多 1 个连续空行，文件末尾最多保留 1 个 EOF 空行
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      /** Possible Errors */
      'max-len': 'off',
      'no-console': 'off',
      'no-debugger': 'error',

      /** Best Practices */
      eqeqeq: ['error', 'always'],
      'no-alert': 'error',
      'no-caller': 'error',
      'no-else-return': 'error',
      'no-empty-function': 'off',
      'no-eval': 'error',
      'no-implicit-globals': 'error',
      'no-multi-spaces': 'error',
      'no-new': 'error',
      'no-return-await': 'off',
      'no-unused-expressions': 'error',

      /** Variables */
      'no-shadow': 'error',
      'no-undef-init': 'error',
      'no-unused-vars': 'off',

      /** Stylistic Issues */
      'array-bracket-spacing': ['error', 'never'],
      'block-spacing': ['error', 'always'],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      camelcase: 'off',
      'eol-last': ['error', 'always'],
      'func-call-spacing': ['error', 'never'],
      indent: 'off',
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'linebreak-style': ['error', 'unix'],
      'no-mixed-spaces-and-tabs': 'error',
      'no-trailing-spaces': 'error',
      'space-before-blocks': ['error', 'always'],
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      'space-in-parens': ['error', 'never'],

      /** TypeScript-Specific Rules */
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': ['off', { allow: [] }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-require-imports': 'error',
    },
  },
]);
