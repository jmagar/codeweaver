# Rule: Code Style and Formatting

This rule defines the code style, formatting, and linting standards for the CodeWeaver project. The goal is to maintain a consistent, clean, and error-free codebase. All code must be formatted with Prettier and pass ESLint checks before being committed.

## Core Tools
- **Formatter**: [Prettier](https://prettier.io/) for automatic, consistent code formatting.
- **Linter**: [ESLint](https://eslint.org/) for identifying and fixing stylistic and programmatic errors.

## Prettier Configuration
The shared Prettier configuration is located in `tooling/prettier`. It is intentionally minimal to rely on Prettier's sensible defaults.

- **Semicolons**: `true`
- **Single Quotes**: `true`
- **Trailing Comma**: `all`
- **Print Width**: 80 characters
- **Tab Width**: 2 spaces

**Usage**: All developers should have the Prettier extension installed in their IDE to format on save. The command `pnpm format` can be run from the root to format the entire project.

## ESLint Configuration
Shared ESLint configurations are located in `tooling/eslint`. Packages and apps extend the appropriate base configuration.

### Key ESLint Rules
1.  **Imports**:
    - Imports must be ordered. We use `@trivago/prettier-plugin-sort-imports` to handle this automatically via Prettier.
    - **Order**: React imports, external library imports, internal absolute imports (`@/`), relative imports (`../`).
    - **Example**:
      ```typescript
      import React from 'react';
      
      import { Button } from '@nextui-org/react';
      import { useQuery } from '@tanstack/react-query';
      
      import { trpc } from '@/lib/trpc';
      import { useUserStore } from '@/stores/user';
      
      import { AnotherComponent } from './another-component';
      ```

2.  **TypeScript**:
    - **`@typescript-eslint/explicit-module-boundary-types`**: `error`. All exported functions and methods must have explicit return types.
    - **`@typescript-eslint/no-unused-vars`**: `warn`. Unused variables should be removed.
    - **`@typescript-eslint/no-explicit-any`**: `warn`. Avoid using `any` where possible. Prefer `unknown` for type-safe assertions.

3.  **React/Next.js**:
    - **`react/react-in-jsx-scope`**: `off`. Not required with Next.js 15 and the new JSX transform.
    - **`react-hooks/rules-of-hooks`**: `error`. Enforces the rules of hooks.
    - **`react-hooks/exhaustive-deps`**: `warn`. Checks for missing dependencies in `useEffect`, `useCallback`, etc.
    - **`@next/next/no-img-element`**: `error`. Use the Next.js `Image` component instead of `<img>`.

4.  **General**:
    - **`no-console`**: `warn` in production builds. Allowed during development but should be removed for production code. Use a proper logger for production logging.
    - **Arrow Functions**: Prefer arrow functions for component declarations and callbacks.
    - **Destructuring**: Use object and array destructuring where it improves readability.

## Type Safety
- **Strict Mode**: All TypeScript configurations must have `strict: true`.
- **Zod for Validation**: All external data (API inputs, environment variables) must be validated with Zod. Do not trust incoming data.

Adherence to these code style rules is enforced automatically by CI checks. Pull requests that fail linting or formatting checks will be blocked from merging. 