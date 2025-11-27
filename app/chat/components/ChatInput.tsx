'use client';

import React, { useState, KeyboardEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const { isAuthenticated, openAuthModal, setPendingMessage } = useAuth();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    if (!isAuthenticated) {
      setPendingMessage(inputValue);
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
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
      />
      <button
        onClick={handleSend}
        disabled={!inputValue.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={20} />
      </button>
    </div>
  );
}
