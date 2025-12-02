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
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isAuthenticated ? "Digite sua mensagem..." : "Faça login para conversar..."}
        disabled={isLoading}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleSend}
        disabled={!inputValue.trim() || isLoading}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
      </button>
    </div>
  );
}
