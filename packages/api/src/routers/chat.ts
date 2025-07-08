import { z } from 'zod';
import { streamText } from 'ai';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { CoreMessage } from 'ai';

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
        model: ctx.aiProvider('mistralai/mistral-7b-instruct:free'),
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