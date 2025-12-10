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
    <div className="w-full max-w-[785px] mx-auto px-4">
      <div className="relative bg-white flex items-center w-full min-h-[80px] px-4 rounded-[16px] shadow-[4px_4px_8px_0px_rgba(0,0,0,0.25)] gap-4">
          
        {/* Left Action: Plus */}
        <button 
            disabled={!isAuthenticated}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-sky-50 transition-colors disabled:opacity-50 text-[#38B1E4]"
            aria-label="Adicionar anexo"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
            </svg>
        </button>

        {/* Input Field */}
        <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Peça a Cloudinha para criar uma lista..." : "Faça login para conversar..."}
            className="flex-1 bg-transparent text-[#3A424E] placeholder-[#3A424E]/50 focus:outline-none text-base font-medium h-full py-4 text-[16px]"
            disabled={isLoading}
        />

        {/* Right Action: Send */}
        <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                inputValue.trim() 
                ? 'bg-[#38B1E4] text-white hover:bg-[#2a9acb] shadow-sm' 
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
            aria-label="Enviar mensagem"
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="m5 12 7-7 7 7"/>
                    <path d="M12 19V5"/>
                </svg>
            )}
        </button>
      </div>

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
