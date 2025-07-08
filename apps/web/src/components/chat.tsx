'use client';

import { useChat } from '@ai-sdk/react';
import { trpc } from '@/utils/trpc';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      async onFinish(message) {
        // TBD
      },
    });

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
        },
      ]);
    },
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          <strong>{`${m.role}: `}</strong>
          {m.content}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          const newMessages = [
            ...messages,
            {
              id: Date.now().toString(),
              role: 'user',
              content: input,
            },
          ];
          setMessages(newMessages);
          chatMutation.mutate({ messages: newMessages });
        }}
      >
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
} 