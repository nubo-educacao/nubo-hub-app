'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ChatBox() {
  const { isAuthenticated, openAuthModal, setPendingMessage, pendingMessage } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();

  // Redirect to chat if logged in and has pending message (from this component)
  useEffect(() => {
    if (isAuthenticated && pendingMessage && inputValue && pendingMessage === inputValue) {
       router.push('/chat');
    }
  }, [isAuthenticated, pendingMessage, router, inputValue]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    setPendingMessage(inputValue);

    if (isAuthenticated) {
      router.push('/chat');
    } else {
      openAuthModal();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Simulated Chat Messages (only visible if logged in, or static demo) */}
      <div className="mb-6 space-y-4">
        <div className="flex justify-start">
          <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%]">
            <p className="text-sm">Olá! Eu sou a Cloudinha. Como posso te ajudar a encontrar sua próxima oportunidade?</p>
          </div>
        </div>
        {isAuthenticated && (
          <div className="flex justify-end">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%]">
              <p className="text-sm">Estou procurando bolsas para Engenharia em São Paulo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-30 group-hover:opacity-50 transition duration-500 ${!isAuthenticated ? 'opacity-10 group-hover:opacity-20' : ''}`}></div>
        <div className="relative bg-neutral-900 rounded-xl p-2 flex items-center gap-2 border border-white/10 shadow-2xl">
          
          {/* Attachment Icon */}
          <button 
            disabled={!isAuthenticated}
            className="p-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Envie uma mensagem para falar com a Cloudinha" : "Faça login para conversar..."}
            className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none py-3 px-2"
          />

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`p-2 rounded-lg transition-all duration-200 ${
              inputValue.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
                : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Login Prompt (if not logged in) */}
      {!isAuthenticated && (
        <div className="mt-3 text-center">
          <p className="text-xs text-neutral-500">
            Você pode explorar o catálogo sem login, mas precisa <span onClick={openAuthModal} className="text-indigo-400 cursor-pointer hover:underline">entrar</span> para usar o chat.
          </p>
        </div>
      )}
    </div>
  );
}
