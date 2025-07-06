<!-- 
---
name: New tRPC Router
description: A template for creating a new tRPC router within the `packages/api` package.
---
-->

```typescript
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';

/**
 * Zod schemas for input validation.
 *
 * @see https://zod.dev/
 */
const {{name}}InputSchema = z.object({
  id: z.string().uuid(),
});

const create{{name}}InputSchema = z.object({
  name: z.string().min(1),
  // Add other fields for creation
});

const update{{name}}InputSchema = z.object({
  id: z.string().uuid(),
  data: create{{name}}InputSchema.partial(), // Allows partial updates
});

/**
 * The main router for the {{name}} domain.
 *
 * This router contains all the procedures related to {{name}}.
 *
 * @see https://trpc.io/docs/server/routers
 */
export const {{name}}Router = createTRPCRouter({
  /**
   * Fetches a single {{name}} by its ID.
   * This is a public procedure, accessible to anyone.
   */
  getById: publicProcedure
    .input({{name}}InputSchema)
    .query(async ({ input, ctx }) => {
      return ctx.db.{{name}}.findUnique({
        where: { id: input.id },
      });
    }),

  /**
   * Fetches a list of {{name}} items.
   * This procedure is protected and requires authentication.
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // Example: Fetch items belonging to the current user
      return ctx.db.{{name}}.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: 'desc' },
      });
    }),

  /**
   * Creates a new {{name}}.
   * This is a protected mutation.
   */
  create: protectedProcedure
    .input(create{{name}}InputSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.{{name}}.create({
        data: {
          ...input,
          userId: ctx.session.user.id, // Associate with the current user
        },
      });
    }),

  /**
   * Updates an existing {{name}}.
   * This is a protected mutation.
   */
  update: protectedProcedure
    .input(update{{name}}InputSchema)
    .mutation(async ({ input, ctx }) => {
      // Optional: Add logic to ensure the user owns this item before updating
      return ctx.db.{{name}}.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  /**
   * Deletes a {{name}}.
   * This is a protected mutation.
   */
  delete: protectedProcedure
    .input({{name}}InputSchema)
    .mutation(async ({ input, ctx }) => {
      // Optional: Add logic to ensure the user owns this item before deleting
      return ctx.db.{{name}}.delete({
        where: { id: input.id },
      });
    }),
});
``` 