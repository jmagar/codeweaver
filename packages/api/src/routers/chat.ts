import { z } from 'zod';
import { streamText, convertToCoreMessages } from 'ai';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Schema for the message format that useChat sends
const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  createdAt: z.date().optional(),
  data: z.any().optional(),
  annotations: z.any().optional(),
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
        messages: z.array(messageSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Convert the messages to CoreMessage format for the AI provider
      // The frontend sends {id, role, content} format, we need to convert to Core format
      const coreMessages = input.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const result = await streamText({
        model: ctx.aiProvider('mistralai/mistral-7b-instruct:free'),
        messages: coreMessages,
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