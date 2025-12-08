'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ChatBox() {
  const { isAuthenticated, openAuthModal, setPendingAction, pendingAction } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect to chat if logged in and has pending message (from this component)
  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'chat' && inputValue && pendingAction.payload.message === inputValue) {
       router.push('/chat');
    }
  }, [isAuthenticated, pendingAction, router, inputValue]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    if (isAuthenticated) {
      setIsLoading(true);
      setPendingAction({ type: 'chat', payload: { message: inputValue } });
      router.push('/chat');
    } else {
      setPendingAction({ type: 'chat', payload: { message: inputValue } });
      openAuthModal();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Input Area */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-20 blur group-hover:opacity-40 transition duration-500 ${!isAuthenticated ? 'opacity-10 group-hover:opacity-20' : ''}`}></div>
        <div className="relative bg-white rounded-full p-2 flex items-center gap-3 shadow-xl">
          
          {/* Plus Icon (Left) */}
          <button 
            disabled={!isAuthenticated}
            className="flex-shrink-0 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Adicionar anexo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Peça a Cloudinha para criar uma lista..." : "Faça login para conversar..."}
            className="flex-1 bg-transparent text-neutral-800 placeholder-neutral-500 focus:outline-none py-3 px-2 text-lg"
            disabled={isLoading}
          />

          {/* Send Arrow Icon (Right) */}
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 p-2 rounded-full transition-all duration-200 ${
              inputValue.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md' 
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
            aria-label="Enviar mensagem"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06l-6.22-6.22V21a.75.75 0 01-1.5 0V4.81l-6.22 6.22a.75.75 0 11-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Login Prompt (if not logged in) */}
      {!isAuthenticated && (
        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-500">
            Você pode explorar o catálogo sem login, mas precisa <span onClick={openAuthModal} className="text-indigo-600 font-medium cursor-pointer hover:underline">entrar</span> para usar o chat.
          </p>
        </div>
      )}
    </div>
  );
}
