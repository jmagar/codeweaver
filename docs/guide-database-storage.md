# Database and Storage Guide

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Overview

This document details the database architecture, schema management, and data access patterns for the CodeWeaver project. Our data layer is built on **PostgreSQL**, with **Prisma** as the ORM for type-safe database access and schema management.

## 2. PostgreSQL and `pgvector`

- **Database**: We use PostgreSQL 15, which is a powerful and reliable open-source relational database.
- **Vector Support**: We use the `pgvector` extension, which is included in our Docker image (`pgvector/pgvector:pg15`). This allows us to store vector embeddings directly in the database and perform efficient similarity searches, which is crucial for AI features like Retrieval-Augmented Generation (RAG).

## 3. Prisma ORM

Prisma is the cornerstone of our data access layer, providing:
- **Type Safety**: Automatically generated TypeScript types from our database schema ensure that all database queries are fully type-safe.
- **Schema Management**: A single source of truth for our database schema located at `packages/db/prisma/schema.prisma`.
- **Migrations**: A clear and repeatable process for evolving the database schema.

### 3.1. Schema Management

The canonical schema is `packages/db/prisma/schema.prisma`. All changes to the database structure **must** be made in this file first.

### 3.2. Migrations and Schema Pushing

- **For development**: We use `pnpm db:push`. This command introspects the Prisma schema and pushes the changes directly to the development database. It's fast and ideal for the iterative nature of development, but it does not create migration files.
- **For production**: A proper migration workflow should be used.
  - `pnpm db:migrate:dev`: This creates a new SQL migration file based on the changes in `schema.prisma`.
  - `pnpm db:migrate:deploy`: This applies all pending migration files to the database. This is the command that should be run in a production deployment pipeline.

### 3.3. Prisma Client

The Prisma Client is a type-safe query builder that is generated from our schema. It is instantiated in `packages/db/src/index.ts` and should be accessed via the tRPC `context` object.

## 4. Querying Best Practices

To ensure performance and maintainability, please follow these best practices.

### 4.1. Select Only What You Need

Avoid over-fetching data by using the `select` or `include` options to specify exactly which fields or relations you need.

```typescript
// Bad: Fetches all fields for the user and all their projects
const user = await ctx.db.user.findUnique({ where: { id: userId } });

// Good: Fetches only the user's id and name
const user = await ctx.db.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true },
});
```

### 4.2. Vector Similarity Search

When working with embeddings, use the `pgvector` capabilities through Prisma's raw query features until official support is mature.

**Example: Finding similar documents**
```typescript
import { Prisma } from '@prisma/client';

// Assume 'embedding' is a Float32Array or number[]
const embedding: number[] = await generateEmbedding("some text");

const result: DocumentEmbedding[] = await prisma.$queryRaw`
  SELECT
    id,
    content,
    1 - (embedding <=> ${Prisma.sql`vector_to_float4_array(${embedding})`}) as similarity
  FROM "DocumentEmbedding"
  ORDER BY similarity DESC
  LIMIT 5;
`
```
*Note: A database index on the `embedding` column is critical for performance. It should be created with a migration.*

```sql
CREATE INDEX ON "DocumentEmbedding" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 4.3. Transactions

For operations that require multiple database writes that must either all succeed or all fail, use transactions to ensure data integrity.

```typescript
const [user, project] = await ctx.db.$transaction([
  ctx.db.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
  }),
  ctx.db.project.create({
    data: { name: 'New Admin Project', userId },
  }),
]);
```

By adhering to these patterns, we maintain a robust, type-safe, and performant data layer. 