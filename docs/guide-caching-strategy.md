# Caching Strategy Guide

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Overview

This document outlines the caching strategy for the CodeWeaver project. Our goal is to improve application performance, reduce latency, and minimize costs associated with third-party API calls (especially to AI providers). We will use **Redis** as our primary caching layer.

## 2. Caching Philosophy

- **Cache Where It Counts**: We will focus on caching data that is expensive to compute or fetch, and that doesn't change frequently.
- **Clear Invalidation**: We must have clear and reliable strategies for cache invalidation to prevent stale data from being served.
- **Layered Approach**: Caching will be implemented at multiple levels, primarily within our tRPC API layer.

## 3. Redis Implementation

Redis is provisioned via our `docker-compose.yml` file and is available to the application. The Redis client should be instantiated once and made available to our tRPC procedures through the context object.

**`packages/api/src/context.ts` (Example)**
```typescript
import { PrismaClient } from '@codeweaver/db';
import { Redis } from 'ioredis';

// It's good practice to initialize clients outside the context creation function
const db = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

export async function createTRPCContext() {
  // ... session logic
  return {
    db,
    redis,
    // ... other context properties
  };
}
```

## 4. Caching Strategies

### 4.1. Caching tRPC Queries

For `query` procedures that fetch relatively static data, we can implement a caching middleware or decorator.

**Example: A tRPC caching middleware**
```typescript
// packages/api/src/trpc.ts

// A middleware that caches the result of a query procedure
const cachedProcedure = publicProcedure.use(async ({ ctx, path, input, next }) => {
  const key = `${path}?input=${JSON.stringify(input)}`;
  
  const cached = await ctx.redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await next();
  
  // Cache the result for 1 hour
  await ctx.redis.set(key, JSON.stringify(result), 'EX', 3600);

  return result;
});

// Usage in a router
export const userRouter = createTRPCRouter({
  // This procedure will now be cached
  getProfile: cachedProcedure.input(...).query(...),
});
```

### 4.2. Caching AI Provider Responses

Caching responses from AI providers is critical for cost and performance.

- **Strategy**: We will cache the final, non-streamed response of an AI interaction. The cache key should be a hash of the conversation history or the specific prompt.
- **Invalidation**: The cache for a conversation should be invalidated whenever a new message is added, ensuring that subsequent requests use the full, up-to-date context.

**Example in a `sendMessage` mutation:**
```typescript
// packages/api/src/routers/chat.ts

// ... inside sendMessage procedure
const cacheKey = `llm-response:${conversationId}:${hashOfMessages}`;
const cachedResponse = await ctx.redis.get(cacheKey);

if (cachedResponse) {
  return JSON.parse(cachedResponse);
}

// ... logic to call AI provider
const finalResponse = await aiProvider.complete(...);

// Cache the final response
await ctx.redis.set(cacheKey, JSON.stringify(finalResponse), 'EX', 86400); // Cache for 24 hours

return finalResponse;
```

## 5. Cache Invalidation

- **Automatic**: Use Time-To-Live (TTL) settings in Redis (like `'EX', 3600`) for data that can expire automatically.
- **Manual/Event-Driven**: When data is updated via a `mutation`, the mutation must be responsible for deleting the relevant cache keys.

**Example: Invalidating a user profile cache**
```typescript
// packages/api/src/routers/user.ts

export const userRouter = createTRPCRouter({
  // ... getProfile query
  updateProfile: protectedProcedure
    .input(...)
    .mutation(async ({ input, ctx }) => {
      // ... update user in database
      
      // Invalidate the cache for this user's profile
      const key = `user.getProfile?input=${JSON.stringify({ userId: ctx.session.user.id })}`;
      await ctx.redis.del(key);

      return updatedUser;
    }),
});
```

By implementing these strategies, we can significantly improve the responsiveness and efficiency of the CodeWeaver application. 