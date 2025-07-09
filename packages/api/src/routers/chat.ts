import { z } from 'zod';
import { streamText } from 'ai';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// Create an event emitter to broadcast messages
const ee = new EventEmitter();

const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant']),
});

type Message = z.infer<typeof messageSchema>;

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string(),
        // We'll add conversation history later
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input.message,
      };

      // Emit the user's message immediately
      ee.emit('newMessage', userMessage);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      };
      
      // Emit an empty assistant message to start
      ee.emit('newMessage', assistantMessage);

      // Stream the AI response
      const result = await streamText({
        model: ctx.aiProvider('mistralai/mistral-7b-instruct:free'),
        messages: [{ role: 'user', content: input.message }],
      });

      // As chunks of the AI's response come in, update the message
      for await (const delta of result.textStream) {
        assistantMessage.content += delta;
        ee.emit('updateMessage', assistantMessage);
      }

      return { success: true };
    }),
  
  onMessage: publicProcedure.subscription(() => {
    return observable<Message>(emit => {
      const onNewMessage = (data: Message) => {
        emit.next(data);
      };
      
      const onUpdateMessage = (data: Message) => {
        emit.next(data);
      };

      ee.on('newMessage', onNewMessage);
      ee.on('updateMessage', onUpdateMessage);

      return () => {
        ee.off('newMessage', onNewMessage);
        ee.off('updateMessage', onUpdateMessage);
      };
    });
  }),
}); 