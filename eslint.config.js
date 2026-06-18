import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import i18next from 'eslint-plugin-i18next';

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  // React hooks rules
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // i18n: flag literal strings inside JSX and key attributes
  {
    ...i18next.configs['flat/recommended'],
    rules: {
      'i18next/no-literal-string': [
        'warn',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            include: ['placeholder', 'title', 'aria-label', 'alt', 'label'],
          },
          // Ignore single characters, purely numeric strings, and common non-copy tokens
          ignore: [/^\d+$/, /^[^a-zA-Z]+$/],
        },
      ],
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/routeTree.gen.ts',
      'src/components/ui/**', // shadcn generated components
      'pocketbase/**',
    ],
  },
);
