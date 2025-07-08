# Complete Project Scaffolding Guide

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Introduction

This guide provides a complete, step-by-step set of instructions for scaffolding the CodeWeaver project from a clean slate. Following these instructions will result in a fully configured local development environment that matches the project's architecture.

## 2. Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js**: v20.x or later
- **pnpm**: v8.x or later (`npm install -g pnpm`)
- **Docker** and **Docker Compose**
- **Git**

You will also need:
- A **Google Cloud Platform** project with OAuth credentials (Client ID and Secret).
- API keys for your desired AI providers (e.g., OpenRouter, Anthropic, Google AI).

## 3. Step-by-Step Scaffolding Instructions

### Step 3.1: Initialize Project and Git Repository

```bash
# Create the project directory and navigate into it
mkdir codeweaver
cd codeweaver

# Initialize a Git repository
git init

# Create an initial README and .gitignore
echo "# CodeWeaver" > README.md
echo "node_modules\n.DS_Store\n*.log\n.env.*\n!.env.example\n.turbo\ndist\nbuild" > .gitignore
```

### Step 3.2: Initialize pnpm Monorepo

```bash
# Create the root package.json
pnpm init

# Edit package.json to set "private": true
# (This is required for pnpm workspaces)

# Create the pnpm workspace configuration file
echo "packages:\n  - 'apps/*'\n  - 'packages/*'\n  - 'tooling/*'" > pnpm-workspace.yaml
```

### Step 3.3: Create Core Directories

```bash
# Create the primary directories for apps, packages, and tooling
mkdir -p apps packages tooling docs .cursor
```

### Step 3.4: Set Up Root Dependencies and Scripts

```bash
# Install root-level development dependencies
pnpm add -D -w typescript prettier eslint turbo @trivago/prettier-plugin-sort-imports

# Add scripts to the root package.json
# (Add these manually to your package.json)
# "scripts": {
#   "build": "turbo build",
#   "dev": "turbo dev",
#   "lint": "turbo lint",
#   "format": "prettier --write .",
#   "test": "turbo test",
#   "typecheck": "turbo typecheck",
#   "db:generate": "pnpm --filter @codeweaver/db db:generate",
#   "db:push": "pnpm --filter @codeweaver/db db:push",
#   "db:studio": "pnpm --filter @codeweaver/db db:studio"
# }
```

### Step 3.5: Set Up Docker and Environment

```bash
# Create the Docker Compose file for local infrastructure
touch docker-compose.yml

# Create the example environment file
touch .env.example
```
**`docker-compose.yml` contents:**
```yaml
version: '3.9'
services:
  postgres:
    image: pgvector/pgvector:pg15
    restart: always
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: codeweaver_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
volumes:
  postgres_data:
  redis_data:
```

**`.env.example` contents:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codeweaver_dev"
# Redis
REDIS_URL="redis://localhost:6379"
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### Step 3.6: Set Up Shared Tooling (`tooling/`)

This step involves creating shared configurations for TypeScript, ESLint, etc. For brevity, the full file contents are not included here but should be created as per the `directory-structure.md` guide.

```bash
# Create directories for shared tooling
mkdir -p tooling/tsconfig tooling/eslint tooling/prettier

# Create base tsconfig.json in tooling/tsconfig/base.json
# Create base .eslintrc.json in tooling/eslint/base.js
# Create .prettierrc.js in tooling/prettier/index.js
```

### Step 3.7: Create Shared Packages (`packages/`)

For each package (`db`, `api`, `ui`, `lib`):
1.  Create the directory: `mkdir -p packages/db`.
2.  Initialize a `package.json`: `pnpm --filter @codeweaver/db init`. (You will need to manually create the `package.json` and give it the name `@codeweaver/db` first).
3.  Add a `tsconfig.json` that extends the base config.
4.  Install necessary dependencies for that package.

**Example for `packages/db`:**
```bash
# Create directory
mkdir -p packages/db/prisma

# Create package.json for @codeweaver/db
# { "name": "@codeweaver/db", "version": "1.0.0", ... }

# Add dependencies
pnpm --filter @codeweaver/db add prisma @prisma/client
pnpm --filter @codeweaver/db add -D typescript

# Create prisma/schema.prisma and lib/index.ts
```

### Step 3.8: Create the Web Application (`apps/web`)

```bash
# Use create-next-app to scaffold the web app
pnpm create next-app ./apps/web --typescript --tailwind --eslint

# Adjust the generated files to use the monorepo's shared configs
# - Update tsconfig.json to extend from tooling/tsconfig
# - Update .eslintrc.json to extend from tooling/eslint
# - Add dependencies on workspace packages
pnpm --filter web add @codeweaver/api @codeweaver/ui @codeweaver/db
```

### Step 3.9: Final Installation and Verification

After all packages and apps are scaffolded:
1.  Run `pnpm install` from the root to link all workspace packages correctly.
2.  Create your `.env.development` file from the example and add your secrets.
3.  Start the infrastructure: `docker compose up -d`.
4.  Push the database schema: `pnpm db:push`.
5.  Start the development server: `pnpm dev`.
6.  Visit `http://localhost:3000` to verify the application is running.

## 4. Conclusion

This scaffolding guide provides the blueprint for setting up the CodeWeaver project. While the process is detailed, it establishes a robust, scalable, and maintainable monorepo structure from the outset. Each command and configuration step is intentional, contributing to the overall architecture defined in the project's technical documentation. 