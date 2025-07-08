# Shadcn/UI Monorepo Guide

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Overview

This guide explains the correct way to install, manage, and use `shadcn/ui` components within our `pnpm` monorepo. Our setup is designed to be scalable and maintainable by centralizing UI components in a shared package.

## 2. Core Philosophy

- **Shared UI Package**: All reusable UI components are located in the `packages/ui` package. This creates a single source of truth for our design system.
- **Consuming Application**: The `apps/web` application consumes the components from `packages/ui`. It is responsible for providing the Tailwind CSS styling context.

This separation ensures that our UI components are decoupled from application-specific logic and can be reused across different applications in the monorepo if needed.

## 3. Key Configuration Files

Our setup relies on a few key files working together:

1.  **`packages/ui/components.json`**: This is the **most important file** for the `shadcn` CLI.
    - It tells the CLI where to find the Tailwind CSS configuration and where to place newly installed components.
    - Its presence inside `packages/ui` is what allows us to run the `add` command from within the `ui` package, which is critical for `pnpm` to resolve dependencies correctly.

2.  **`apps/web/tailwind.config.ts`**: The Tailwind CSS configuration for our web application.
    - The `content` array in this file is configured to scan for class names in both `apps/web` and `packages/ui`. This is how styles from our shared components are detected and included in the final CSS build.
    - `content: ['../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}', ...]`

3.  **`apps/web/tsconfig.json`**: The TypeScript configuration for our web app.
    - It contains path aliases (`@/components/*` and `@/lib/*`) that point directly to the corresponding directories in `packages/ui`.
    - This allows for clean, consistent imports (e.g., `import { Button } from '@/components/ui/button'`) both in our app's code and within the `shadcn` components themselves.

## 4. How to Add a New Component

This is the **only** correct procedure for adding a new `shadcn` component to our project.

1.  **Navigate to the UI package**:
    ```bash
    cd packages/ui
    ```

2.  **Run the `add` command**:
    ```bash
    pnpm dlx shadcn@latest add <component-name>
    ```
    *Example: `pnpm dlx shadcn@latest add card`*

This process works because:
- You are running the command from the directory that contains `components.json`.
- `pnpm` correctly installs any new peer dependencies (like `@radix-ui/react-dialog`) into the `packages/ui/package.json` file, avoiding workspace errors.
- The component files are placed directly into `packages/ui/src/components/ui`.

## 5. How to Use Components in the Web App

Once a component is added to `packages/ui`, you can use it in `apps/web` like any other component.

**Example: Using the Button component**

```tsx
// in a component inside apps/web/src/app/...

import { Button } from '@codeweaver/ui/components/ui/button';

export function MyComponent() {
  return (
    <div>
      <Button>Click Me</Button>
    </div>
  );
}
```

Because of our TypeScript path aliases, you can also use the aliased path, which is how `shadcn` components often import each other:

```tsx
import { Button } from '@/components/ui/button';
```

This setup ensures a robust, scalable, and easy-to-manage UI component library for our project. 