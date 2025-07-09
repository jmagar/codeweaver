import { Chat } from '../components/chat';
import { type JSX } from 'react';

const Home = (): JSX.Element => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Chat />
    </main>
  );
};

export default Home;
