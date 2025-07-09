'use client';

import { FormEvent, useState } from 'react';
import { trpc } from '@/utils/trpc';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  trpc.chat.onMessage.useSubscription(undefined, {
    onData(data) {
      setMessages(prevMessages => {
        const existingMessageIndex = prevMessages.findIndex(m => m.id === data.id);
        if (existingMessageIndex !== -1) {
          // Update existing message
          const newMessages = [...prevMessages];
          newMessages[existingMessageIndex] = data;
          return newMessages;
        } else {
          // Add new message
          return [...prevMessages, data];
        }
      });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input) return;

    const newUserMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
    };

    const newMessages = [...messages, newUserMessage];

    // Optimistically update the UI
    setMessages(newMessages);

    // Send the whole conversation history
    sendMessageMutation.mutate({
      messages: newMessages,
    });

    setInput('');
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          <strong>{`${m.role}: `}</strong>
          <span>{m.content}</span>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.target.value)}
          disabled={sendMessageMutation.isPending}
        />
      </form>
    </div>
  );
} 