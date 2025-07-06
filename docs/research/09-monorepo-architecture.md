# Monorepo Architecture Research

## Executive Summary

This document provides comprehensive research on modern monorepo architecture patterns, focusing on pnpm workspaces, TypeScript project references, and Docker integration for 2024-2025 best practices.

## Key Findings

### 1. Package Manager Selection: pnpm Workspaces

**Why pnpm over npm/yarn:**
- **Disk Space Efficiency**: Uses content-addressable storage, significantly reducing disk usage
- **Dependency Isolation**: Prevents phantom dependencies through strict package isolation
- **Performance**: Faster installation times compared to npm and Yarn Classic
- **Growing Adoption**: Used by Next.js, Vite, Prisma, NextAuth.js, and Material UI
- **Superior CLI**: More powerful command-line interface with advanced filtering options

**pnpm Workspace Configuration:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// Root package.json
{
  "name": "monorepo",
  "private": true,
  "packageManager": "pnpm@8.15.5",
  "engines": {
    "node": "^20"
  },
  "scripts": {
    "build": "pnpm --filter '@scope/*' build",
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "lint": "pnpm --filter '@scope/*' lint",
    "typecheck": "pnpm --filter '@scope/*' typecheck"
  }
}
```

### 2. TypeScript Project References Architecture

**Benefits:**
- **Incremental Compilation**: Only recompile changed projects
- **Memory Efficiency**: Process smaller, isolated projects
- **Build Caching**: TypeScript generates `.tsbuildinfo` files for faster rebuilds
- **Project Boundaries**: Enforces proper dependency relationships
- **IDE Performance**: Better autocomplete and type-checking in large codebases

**Configuration Pattern:**
```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/ui" },
    { "path": "./apps/web" },
    { "path": "./apps/api" }
  ]
}
```

```json
// tsconfig.base.json (shared configuration)
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    "noEmitOnError": true,
    "skipLibCheck": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### 3. ESM Module Strategy

**Key Principles:**
- **ESM-First**: All packages configured as ES modules
- **Bundler Support**: Use `moduleResolution: "bundler"` for flexibility
- **File Extensions**: Leverage bundlers to avoid `.js` extensions in imports
- **Dual Output**: Support both ESM and CommonJS when needed

**Package.json Configuration:**
```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/cjs/index.js"
    }
  },
  "main": "./dist/cjs/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### 4. Docker Integration Patterns

**Multi-Stage Build Strategy:**
```dockerfile
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 5. Development Workflow Optimization

**Turbo Integration:**
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Watch Mode Setup:**
```json
{
  "scripts": {
    "dev": "turbo watch dev",
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev"
  }
}
```

## Architecture Patterns

### 1. Package Organization

```
monorepo/
├── apps/
│   ├── web/                 # Next.js application
│   ├── api/                 # Express/Fastify API
│   └── docs/                # Documentation site
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── shared/              # Shared utilities
│   ├── config/              # Shared configurations
│   └── database/            # Database schema/client
├── tools/
│   ├── eslint-config/       # Shared ESLint config
│   ├── typescript-config/   # Shared TypeScript config
│   └── build-scripts/       # Build utilities
└── docs/                    # Project documentation
```

### 2. Dependency Management Strategy

**Workspace Protocol Usage:**
```json
{
  "dependencies": {
    "@scope/ui": "workspace:*",
    "@scope/shared": "workspace:^"
  }
}
```

**Version Management:**
- Use `workspace:*` for latest version
- Use `workspace:^` for semver range
- Use `workspace:~` for patch-level updates

### 3. Build Orchestration

**Build Dependencies:**
```json
// Package build order automatically handled by TypeScript references
{
  "references": [
    { "path": "../shared" },    // Built first
    { "path": "../ui" }         // Built second
  ]
}
```

**Parallel Execution:**
```bash
# Build all packages in parallel where possible
pnpm --parallel --filter './packages/*' build

# Build specific app with dependencies
pnpm --filter web build
```

## Performance Optimizations

### 1. Build Caching

**TypeScript Incremental Builds:**
- Enable `composite: true` and `incremental: true`
- Use `.tsbuildinfo` files for change tracking
- Configure proper `outDir` structure

**Turbo Caching:**
- Configure remote caching for CI/CD
- Use proper cache keys based on file hashes
- Leverage shared cache across team members

### 2. Development Speed

**Hot Module Replacement:**
- Configure bundlers to watch workspace dependencies
- Use source maps for debugging
- Enable fast refresh in React applications

**IDE Integration:**
- Configure TypeScript project references for go-to-definition
- Use declaration maps for source navigation
- Set up proper workspace settings in VS Code

## CI/CD Integration

### 1. GitHub Actions Example

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

### 2. Affected Testing

```bash
# Only test changed packages
pnpm --filter='...[HEAD~1]' test

# Build only affected packages
pnpm --filter='...[HEAD~1]' build
```

## Security Considerations

### 1. Dependency Management

- Use `pnpm audit` for security scanning
- Configure `.npmrc` for registry security
- Implement dependency update automation
- Use lockfile validation in CI

### 2. Package Isolation

- Leverage pnpm's strict dependency isolation
- Avoid phantom dependencies
- Use explicit dependency declarations
- Configure proper package boundaries

## Migration Strategies

### 1. From npm/yarn to pnpm

```bash
# Remove existing lockfiles and node_modules
rm -rf node_modules package-lock.json yarn.lock

# Import existing lockfile
pnpm import

# Install dependencies
pnpm install
```

### 2. Adding TypeScript Project References

1. Enable `composite: true` in all package tsconfigs
2. Add `references` arrays to dependent packages
3. Switch from `tsc` to `tsc --build`
4. Configure proper `outDir` structure

## Common Pitfalls and Solutions

### 1. Circular Dependencies

**Problem:** Package A depends on Package B, which depends on Package A
**Solution:** Extract shared code into a third package

### 2. Build Order Issues

**Problem:** Packages building in wrong order
**Solution:** Use TypeScript project references to establish dependency graph

### 3. Docker Build Optimization

**Problem:** Slow Docker builds in monorepo
**Solution:** Use multi-stage builds with proper layer caching

### 4. ESM/CommonJS Compatibility

**Problem:** Mixed module systems causing runtime errors
**Solution:** Use bundlers with dual output or transpilation

## Recommended Tools and Libraries

### 1. Essential Tools

- **pnpm**: Package manager with workspace support
- **TypeScript**: Type checking with project references
- **Turbo**: Build system and task runner
- **ESLint**: Code linting with shared configurations
- **Prettier**: Code formatting with shared rules

### 2. Optional Enhancements

- **Changesets**: Version management and changelog generation
- **Nx**: Advanced monorepo tooling with computation caching
- **Rush**: Microsoft's monorepo manager
- **Lerna**: Package management and publishing

### 3. Development Tools

- **tsx**: TypeScript execution for development
- **tsup**: Fast TypeScript bundler
- **Vite**: Fast build tool with HMR
- **Jest**: Testing framework with workspace support

## Future Considerations

### 1. Emerging Technologies

- **Bun**: Alternative runtime with built-in package manager
- **Deno**: Modern runtime with TypeScript support
- **esbuild**: Extremely fast bundler
- **SWC**: Fast TypeScript/JavaScript compiler

### 2. Ecosystem Evolution

- **Package.json exports**: Better module resolution
- **Import maps**: Browser-native module resolution
- **ES modules**: Continued adoption across ecosystem
- **TypeScript 5.x**: Improved project references and performance

## Conclusion

Modern monorepo architecture with pnpm workspaces and TypeScript project references provides:

1. **Scalability**: Handle large codebases with multiple teams
2. **Performance**: Fast builds through incremental compilation and caching
3. **Developer Experience**: Excellent tooling and IDE integration
4. **Maintainability**: Clear dependency boundaries and shared configurations
5. **Deployment**: Flexible Docker strategies for containerized applications

The combination of pnpm workspaces, TypeScript project references, and modern build tools creates a robust foundation for enterprise-scale development while maintaining developer productivity and code quality. 