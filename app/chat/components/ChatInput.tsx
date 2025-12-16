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
    <div className="relative z-20 w-full">
      <div className="flex items-center gap-2 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-2 py-1">
        <div className="flex-1">
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAuthenticated ? "Digite sua mensagem..." : "Faça login para conversar..."}
            disabled={isLoading}
            className="w-full bg-transparent border-none text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-sm px-3 py-3 h-[48px]"
            />
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
