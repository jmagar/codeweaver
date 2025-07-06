# Comprehensive Directory Structure Guide

**Version:** 1.0  
**Date:** January 2025

## 1. Overview

This document provides a comprehensive guide to the monorepo directory structure for the **CodeWeaver** project. The structure is designed for scalability, maintainability, and clear separation of concerns, leveraging a `pnpm` workspace.

The core philosophy is to separate concerns into three main categories:
- **`apps/`**: Deployable applications (e.g., the web frontend, documentation site).
- **`packages/`**: Shared code, libraries, and configurations used across multiple applications.
- **`tooling/`**: Development and operational tooling that supports the monorepo but isn't part of the runtime code.

## 2. Root Directory

The root of the monorepo contains top-level configuration files that govern the entire project.

```
/
├── .bivvy/                   # Bivvy climb management files
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore file
├── docker-compose.yml        # Docker Compose for dev infrastructure
├── package.json              # Root package configuration (workspaces, scripts)
├── pnpm-lock.yaml            # pnpm lockfile for deterministic installs
├── pnpm-workspace.yaml       # Defines the pnpm workspace layout
├── README.md                 # Project overview and setup instructions
├── tsconfig.json             # Root TypeScript config for project references
└── turbo.json                # Turborepo pipeline configuration
```

- **`pnpm-workspace.yaml`**: The heart of the monorepo, defining which directories are part of the workspace.
- **`turbo.json`**: Configures the build system pipelines, defining task dependencies and caching strategies.
- **`tsconfig.json`**: The root TypeScript file that uses `references` to link all the packages and apps together, enabling incremental builds.

## 3. `apps/` Directory

This directory contains the actual applications that are deployed. Each sub-directory is a standalone, runnable application.

```
apps/
└── web/
    ├── .env.local
    ├── .eslintrc.js
    ├── next.config.mjs
    ├── package.json
    ├── postcss.config.js
    ├── public/
    ├── src/
    │   ├── app/
    │   │   ├── (api)/
    │   │   │   └── trpc/[trpc]/route.ts  # tRPC API handler
    │   │   ├── (auth)/
    │   │   │   └── signin/page.tsx
    │   │   ├── (protected)/
    │   │   │   ├── dashboard/page.tsx
    │   │   │   └── layout.tsx
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   └── ui/                   # UI components specific to this app
    │   ├── hooks/
    │   └── lib/
    │       └── trpc/
    │           └── client.ts       # Client-side tRPC provider
    └── tailwind.config.ts
```

- **`apps/web`**: The main Next.js 15 frontend application. It imports shared logic from the `packages/` directory.
- **Route Groups `( )`**: Next.js 15 App Router route groups are used to organize routes without affecting the URL path (e.g., for `api`, `auth`, `protected` layouts).

## 4. `packages/` Directory

This is where all the shared code lives. Each package has a specific responsibility and can be versioned and published independently if needed.

```
packages/
├── api/
│   ├── src/
│   │   ├── context.ts         # tRPC context creation
│   │   ├── root.ts            # Root tRPC router (_app)
│   │   ├── routers/           # Domain-specific routers (user, chat, etc.)
│   │   └── trpc.ts            # tRPC initialization
│   └── package.json
├── db/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma      # Prisma database schema
│   ├── src/
│   │   └── index.ts           # Exports the Prisma client instance
│   └── package.json
├── lib/
│   ├── src/
│   │   ├── ai/                # AI provider abstractions
│   │   ├── mcp/               # MCP client logic
│   │   └── utils/             # General utility functions
│   └── package.json
└── ui/
    ├── src/
    │   ├── components/        # Shared, reusable React components
    │   └── theme/             # Tailwind theme presets
    └── package.json
```

- **`packages/api`**: Defines the entire tRPC router. This package is consumed by the `apps/web` API handler, keeping the API logic decoupled from the Next.js app.
- **`packages/db`**: Contains the Prisma schema, migrations, and the instantiated client. Any app or package needing database access depends on this package.
- **`packages/lib`**: A place for shared, non-framework-specific business logic, such as AI provider abstractions, MCP clients, and other core utilities.
- **`packages/ui`**: A shared component library, potentially using a system like Shadcn/UI, Radix, or a custom Storybook setup.

## 5. `tooling/` Directory

This directory contains configurations and scripts related to development tooling, ensuring consistency across the monorepo.

```
tooling/
├── eslint/
│   ├── next.js
│   ├── react.js
│   └── package.json
├── prettier/
│   ├── index.js
│   └── package.json
├── tsconfig/
│   ├── base.json
│   ├── nextjs.json
│   ├── react-library.json
│   └── package.json
└── jest/
    ├── jest.preset.js
    └── package.json
```

- **`tooling/eslint`**: Contains shareable ESLint configurations (e.g., for Next.js apps, for React libraries). Applications and packages will extend these configs in their local `.eslintrc.js`.
- **`tooling/prettier`**: A single, shared Prettier configuration to enforce consistent code style everywhere.
- **`tooling/tsconfig`**: Contains base TypeScript configurations (`tsconfig.base.json`, `tsconfig.nextjs.json`, etc.) that are extended by the `tsconfig.json` files in individual apps and packages.
- **`tooling/jest`**: Shared Jest configuration presets for unit and integration testing.

## 6. Naming Conventions

- **Packages**: `kebab-case` (e.g., `packages/db`, `packages/trpc-api`).
- **Workspace Scope**: Use a consistent scope for internal packages (e.g., `@codeweaver/api`, `@codeweaver/ui`).
- **Components**: `PascalCase` (e.g., `Button.tsx`, `UserProfile.tsx`).
- **API Procedures**: `camelCase` (e.g., `user.getProfile`, `chat.sendMessage`).
- **Files**: `kebab-case` for most files (e.g., `db-client.ts`), `PascalCase` for React components.

## 7. Rationale and Benefits

This structure provides several key advantages:

1.  **Scalability**: New applications or packages can be added easily without disrupting existing ones.
2.  **Code Reuse**: Shared logic (`ui`, `lib`, `db`) is centralized, reducing duplication and making updates easier.
3.  **Clear Ownership**: The separation between `apps` and `packages` makes it clear what is a deployable unit versus a shared library.
4.  **Optimized Tooling**: Centralized tooling configurations (`eslint`, `tsconfig`) ensure consistency and simplify setup for new packages.
5.  **Efficient Builds**: With TypeScript project references and Turborepo, only the affected parts of the monorepo are rebuilt, leading to faster CI/CD and development cycles.
6.  **Decoupling**: The API layer (`packages/api`) is decoupled from the web server (`apps/web`), making it possible to serve the same API from different applications (e.g., a mobile app backend) in the future. 