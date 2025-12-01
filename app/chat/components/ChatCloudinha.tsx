'use client';

import React, { useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';

// Mock initial messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'cloudinha',
    text: 'Olá! Sou a Cloudinha 💜 Como posso ajudar você a encontrar a oportunidade perfeita hoje?',
    timestamp: new Date(),
  },
];

export interface Message {
  id: string;
  sender: 'user' | 'cloudinha';
  text: string;
  timestamp: Date;
}

export default function ChatCloudinha() {
  const { user, isAuthenticated, pendingMessage, setPendingMessage } = useAuth();
  
  // Initialize messages based on whether there's a pending message
  // If there is a pending message, we start empty and let the effect handle it
  // If not, we show the initial greeting
  const [messages, setMessages] = React.useState<Message[]>(() => {
    if (typeof window !== 'undefined' && pendingMessage) return [];
    return INITIAL_MESSAGES;
  });
  
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedPendingMessage = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle pending message after login
  useEffect(() => {
    if (isAuthenticated && pendingMessage && !processedPendingMessage.current) {
      processedPendingMessage.current = true;
      handleSendMessage(pendingMessage);
      setPendingMessage(null);
    }
  }, [isAuthenticated, pendingMessage, setPendingMessage]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: messages, // Sending history for context if needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'cloudinha',
        text: data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, responseMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'cloudinha',
        text: 'Desculpe, tive um problema ao conectar com minha nuvem. Tente novamente mais tarde. 🌧️',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="text-xl">☁️</span>
        </div>
        <div>
          <h2 className="font-bold text-white">Fale com a Cloudinha</h2>
          <p className="text-xs text-purple-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Online agora
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} userAvatar={user?.avatar} />
        ))}
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gray-400 text-sm p-2"
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
