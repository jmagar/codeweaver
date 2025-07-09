import { z } from 'zod';
import { streamText } from 'ai';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// TODO: Replace with Redis pub/sub for multi-instance support
// For now, using EventEmitter (single instance only)
const ee = new EventEmitter();
ee.setMaxListeners(0);

const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant']),
});

type Message = z.infer<typeof messageSchema>;

export const chatRouter = createTRPCRouter({
  // Mutation: send a message and stream assistant response
  sendMessage: publicProcedure
    .input(
      z.object({
        messages: z.array(messageSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // The last message is the new one from the user
      const lastMessage = input.messages[input.messages.length - 1];

      // Emit the user's message immediately if it's not already on the client
      // (The client-side optimistic update handles this, but this is a safeguard)
      if (lastMessage && lastMessage.role === 'user') {
        ee.emit('newMessage', lastMessage);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      };
      
      // Emit an empty assistant message to start
      ee.emit('newMessage', assistantMessage);

      // Stream the AI response
      const result = await streamText({
        model: ctx.aiProvider('gpt-3.5-turbo'),
        messages: input.messages, // Pass the whole conversation
      });

      // As chunks of the AI's response come in, update the message
      for await (const delta of result.textStream) {
        assistantMessage.content += delta;
        ee.emit('updateMessage', { ...assistantMessage });
      }

      return assistantMessage;
    }),
  
  // Subscription: receive new and updated messages in real-time
  onMessage: publicProcedure.subscription(() => {
    return observable<Message>(emit => {
      const onNewMessage = (data: Message) => emit.next(data);
      const onUpdateMessage = (data: Message) => emit.next(data);

      ee.on('newMessage', onNewMessage);
      ee.on('updateMessage', onUpdateMessage);

      return () => {
        ee.off('newMessage', onNewMessage);
        ee.off('updateMessage', onUpdateMessage);
      };
    });
  }),
}); 

export type ChatRouter = typeof chatRouter; 