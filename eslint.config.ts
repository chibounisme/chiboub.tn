import css from '@eslint/css';
import js from '@eslint/js';
import markdown from '@eslint/markdown';
import html from '@html-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import tailwind from 'eslint-plugin-better-tailwindcss';
import jsonc from 'eslint-plugin-jsonc';
import * as mdx from 'eslint-plugin-mdx';
import yml from 'eslint-plugin-yml';
import { tailwind4 } from 'tailwind-csstree';
import tseslint from 'typescript-eslint';

const codeStyle = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: true,
  jsx: true,
  braceStyle: '1tbs',
});

const tailwindClasses = {
  plugins: { 'better-tailwindcss': tailwind },
  settings: {
    'better-tailwindcss': { entryPoint: './src/index.css' },
  },
  rules: {
    'better-tailwindcss/enforce-consistent-class-order': 'error',
    'better-tailwindcss/no-duplicate-classes': 'error',
    'better-tailwindcss/no-unnecessary-whitespace': 'error',
  },
} as const;

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.pnpm-store/**',
    'dist/**',
    'coverage/**',
    '.build/**',
    'lighthouse-reports/**',
    'pnpm-lock.yaml',
  ]),
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      codeStyle,
      tailwindClasses,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      curly: ['error', 'multi-line'],
      eqeqeq: ['error', 'always'],
      'no-nested-ternary': 'error',
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
    },
  },
  {
    // Ambient module declarations need import types to reference local modules.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { disallowTypeAnnotations: false },
      ],
    },
  },
  {
    files: ['**/*.json'],
    extends: [jsonc.configs['recommended-with-json']],
  },
  {
    files: ['**/*.jsonc'],
    extends: [jsonc.configs['recommended-with-jsonc']],
  },
  {
    files: ['**/*.{json,jsonc}'],
    plugins: { jsonc },
    rules: {
      'jsonc/indent': ['error', 2],
      'jsonc/key-spacing': 'error',
      'jsonc/object-curly-spacing': ['error', 'always'],
      'jsonc/object-curly-newline': ['error', { multiline: true, consistent: true }],
      'jsonc/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      'jsonc/array-bracket-spacing': ['error', 'never'],
    },
  },
  {
    files: ['**/*.{yaml,yml}'],
    extends: [yml.configs.standard],
    rules: {
      'yml/indent': ['error', 2],
      // GitHub Actions uses empty mappings for events such as workflow_dispatch.
      'yml/no-empty-mapping-value': 'off',
    },
  },
  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    extends: [css.configs.recommended],
    languageOptions: { customSyntax: tailwind4, tolerant: true },
    rules: {
      // Preserve the existing browser feature policy without adding a Baseline cutoff.
      'css/use-baseline': 'off',
      // Tailwind expands theme variables and utilities during the CSS build.
      'css/no-invalid-properties': ['error', { allowUnknownVariables: true }],
    },
  },
  {
    files: ['**/*.md'],
    extends: [markdown.configs.recommended],
    language: 'markdown/gfm',
  },
  {
    // Stylistic's JavaScript rules cannot safely rewrite Markdown text nodes.
    ...mdx.flat,
    files: ['**/*.mdx'],
    extends: [tailwindClasses],
    rules: {
      ...mdx.flat.rules,
      'mdx/remark': 'error',
    },
  },
  {
    files: ['**/*.{html,svg}'],
    plugins: { html },
    language: 'html/html',
    rules: {
      'html/indent': ['error', 2],
      'html/quotes': ['error', 'double'],
      'html/no-duplicate-attrs': 'error',
      'html/no-extra-spacing-tags': 'error',
      'html/no-trailing-spaces': 'error',
    },
  },
]);
