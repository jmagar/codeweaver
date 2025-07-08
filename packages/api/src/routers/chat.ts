import { z } from 'zod';
import { streamText, CoreMessage } from 'ai';
import { createTRPCRouter, publicProcedure } from '../trpc';

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool', 'function']),
  content: z.string(),
  toolInvocations: z.optional(z.any()),
  toolResult: z.optional(z.any()),
  data: z.optional(z.any()),
  annotations: z.optional(z.any()),
});

/**
 * The main router for chat-related functionality.
 *
 * @see https://trpc.io/docs/server/routers
 */
export const chatRouter = createTRPCRouter({
  /**
   * A placeholder procedure. We will add the `sendMessage` mutation here.
   */
  hello: publicProcedure.query(() => {
    return 'Hello from the chat router!';
  }),

  sendMessage: publicProcedure
    .input(
      z.object({
        messages: z.array(z.custom<CoreMessage>()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await streamText({
        model: ctx.aiProvider.chat('mistralai/mistral-7b-instruct:free'),
        messages: input.messages,
      });

      // Return the full text content once the stream is complete.
      // This is a temporary measure to get a working endpoint.
      // We will implement proper streaming in a future step.
      return {
        role: 'assistant',
        content: await result.text,
      };
    }),
}); 