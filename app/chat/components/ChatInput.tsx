'use client';

import React, { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const { isAuthenticated, openAuthModal, pendingAction, setPendingAction, clearPendingAction } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'chat' && !processedRef.current) {
      processedRef.current = true;
      const message = pendingAction.payload.message;
      setInputValue(message);
      // Optional: Auto-send
      onSendMessage(message);
      setInputValue('');
      clearPendingAction();
    }
  }, [isAuthenticated, pendingAction, onSendMessage, clearPendingAction]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    if (!isAuthenticated) {
      setPendingAction({ type: 'chat', payload: { message: inputValue } });
      openAuthModal();
      return;
    }

    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="relative z-20 w-full max-w-4xl mx-auto">
      <div className="flex items-center w-full bg-white border border-[#E3E8EF] rounded-[24px] px-2 py-2 shadow-lg gap-2">
        
        {/* Plus Button - Visual only for now or file upload in future */}
        <button 
            type="button"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-sky-50 text-[#38B1E4] transition-colors"
        >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
            </svg>
        </button>

        <div className="flex-1">
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Digite sua mensagem..." : "Faça login para conversar..."}
            disabled={isLoading}
            className="w-full bg-transparent border-none text-[#374151] placeholder-gray-400 focus:outline-none focus:ring-0 text-[15px] px-2 py-3 h-[48px]"
            />
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
              inputValue.trim() 
              ? 'bg-[#38B1E4] hover:bg-[#2a9acb] text-white shadow-md' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
               <Loader2 size={20} className="animate-spin" /> 
           ) : (
               <Send size={20} className="ml-0.5" />
           )}
        </button>
      </div>
    </div>
  );
}
