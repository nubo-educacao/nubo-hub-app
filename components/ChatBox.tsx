'use client';

import { FormEvent, useState } from 'react';

type ChatBoxProps = {
  isLoggedIn: boolean;
};

const simulatedMessages = [
  {
    id: '1',
    sender: 'Cloudinha',
    message: 'Olá! Sou a Cloudinha. Quer ajuda para encontrar bolsas e programas sob medida?'
  },
  {
    id: '2',
    sender: 'Você',
    message: 'Estou buscando uma bolsa integral em tecnologia, de preferência EAD.'
  },
  {
    id: '3',
    sender: 'Cloudinha',
    message: 'Perfeito! Já tenho algumas oportunidades que combinam com você. Vamos conferir?'
  }
];

export default function ChatBox({ isLoggedIn }: ChatBoxProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoggedIn || !message.trim()) return;
    setMessage('');
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl shadow-indigo-800/30 backdrop-blur">
      <div className="space-y-3">
        {simulatedMessages.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-white/50">{entry.sender}</span>
            <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90">{entry.message}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-3">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 text-lg text-white/70 transition hover:text-white"
          aria-label="Adicionar anexo"
          disabled={!isLoggedIn}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16.5 7.5v6.75a4.5 4.5 0 1 1-9 0V6.75a3 3 0 1 1 6 0v6" />
          </svg>
        </button>
        <div className="flex-1">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none disabled:cursor-not-allowed"
            placeholder={
              isLoggedIn ? 'Faça uma pergunta para a Cloudinha...' : 'Faça login para conversar com a Cloudinha'
            }
            disabled={!isLoggedIn}
          />
        </div>
        <button
          type="submit"
          className="flex h-11 min-w-[4rem] items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 px-4 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isLoggedIn || !message.trim()}
        >
          Enviar
        </button>
      </form>

      {!isLoggedIn && (
        <p className="mt-3 text-xs text-white/70">
          Você pode explorar o catálogo sem login, mas precisa entrar para usar o chat.
        </p>
      )}
    </div>
  );
}
