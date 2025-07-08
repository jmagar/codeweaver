<!--
---
name: Caching Patterns
description: A template for implementing caching strategies across the stack.
---
-->

This document outlines the standard caching patterns to be used within the CodeWeaver application. Effective caching is crucial for performance, reducing database load, and improving user experience.

## 1. Server-Side Caching with Next.js

For Server Components, use Next.js's built-in `cache` function (a stable replacement for `unstable_cache`) to cache the result of expensive data fetches. This is ideal for data that is shared across users and can be stale for a defined period.

### Usage

Wrap your data-fetching function with `cache` from React. For time-based revalidation or tag-based invalidation, use Next.js's fetch options or custom cache handlers.

```typescript
// packages/lib/src/data/some-data.ts
import { cache } from 'react';
import { db } from '@codeweaver/db';

/**
 * Fetches a list of public projects, cached for 60 seconds.
 * The `cache` function ensures that multiple calls to this function
 * within the same request lifecycle will only hit the database once.
 */
export const getPublicProjects = cache(async () => {
  // This database query will only run once per request, even if called multiple times.
  const projects = await db.project.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
  });
  return projects;
});

// To use with revalidation tags:
export async function getProjectById(id: string) {
  // This uses Next.js's extended fetch API for caching and revalidation.
  // We can revalidate this data on-demand using the 'projects' tag.
  const project = await db.project.findUnique({
    where: { id },
    // This is a simplified example; in a real scenario you'd use a fetch wrapper
    // or a more direct cache API that supports tagging.
  });
  return project;
}
```

### Invalidation

- **Time-based**: The `revalidate` option in `fetch` calls.
- **On-demand**: Use `revalidateTag` or `revalidatePath` from `next/cache` in a tRPC mutation or API route after data changes.

```typescript
// packages/api/src/routers/project.ts
import { revalidateTag } from 'next/cache';

// ... in an update mutation
update: protectedProcedure
  .input(/*...*/)
  .mutation(async ({ input, ctx }) => {
    const updatedProject = await ctx.db.project.update(/*...*/);
    // Invalidate the cache for any data tagged with 'projects'
    revalidateTag('projects');
    return updatedProject;
  }),
```

---

## 2. Client-Side Caching with tRPC (React Query)

On the client, tRPC's `useQuery` hook leverages React Query for automatic caching, which is excellent for managing the state of server data in the UI.

- **`staleTime`**: The duration (in ms) until stale data is refetched in the background. Default is `0`.
- **`cacheTime`**: The duration (in ms) that unused/inactive data remains in memory. Default is 5 minutes.

```typescript
// app/web/src/components/some-client-component.tsx
'use client';

import { trpc } from '@/lib/trpc/client';

const ProjectList = () => {
  const { data: projects, isLoading } = trpc.project.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    // This query will not be refetched for 5 minutes unless invalidated.
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {projects?.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
};
```

### Invalidation

Use `trpc.useUtils()` inside a component to invalidate queries after a mutation.

```typescript
// app/web/src/components/some-client-component.tsx
'use client';

import { trpc } from '@/lib/trpc/client';

const CreateProjectButton = () => {
  const utils = trpc.useUtils();
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      // Invalidate the 'list' query to force a refetch
      utils.project.list.invalidate();
    },
  });

  return <button onClick={() => createProject.mutate({ name: 'New Project' })}>Create</button>
};
```

---

## 3. Application-Level Caching with Redis

For very expensive or globally accessed data, use an external cache like Redis at the tRPC procedure level.

### Redis Client Setup
```typescript
// packages/lib/src/redis.ts
import { Redis } from 'ioredis';

// This creates a singleton instance of the Redis client.
export const redis = new Redis(process.env.REDIS_URL!);
```

### Cached tRPC Procedure

```typescript
// packages/api/src/routers/stats.ts
import { redis } from '@codeweaver/lib/redis';
import { createTRPCRouter, publicProcedure } from '../trpc';

const CACHE_KEY = 'global-stats';

export const statsRouter = createTRPCRouter({
  getGlobalStats: publicProcedure
    .query(async ({ ctx }) => {
      // 1. Try to fetch from cache first
      const cachedStats = await redis.get(CACHE_KEY);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }

      // 2. If not in cache, perform the expensive operation
      const stats = {
        totalUsers: await ctx.db.user.count(),
        totalProjects: await ctx.db.project.count(),
      };

      // 3. Store the result in Redis with a Time-To-Live (TTL) of 1 hour
      await redis.set(CACHE_KEY, JSON.stringify(stats), 'EX', 3600);

      return stats;
    }),
});
```

### Invalidation

Invalidate the Redis key explicitly in a mutation when the underlying data changes.

```typescript
// packages/api/src/routers/user.ts
import { redis } from '@codeweaver/lib/redis';

// ... in a procedure that creates a user
createUser: publicProcedure
  .input(/*...*/)
  .mutation(async ({ input, ctx }) => {
    const newUser = await ctx.db.user.create({ data: input });
    // Invalidate the stats cache because a new user was added
    await redis.del('global-stats');
    return newUser;
  }),
``` 