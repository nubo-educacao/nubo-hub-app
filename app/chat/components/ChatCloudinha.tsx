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

import { supabase } from '@/lib/supabaseClient';

export default function ChatCloudinha({ 
  initialMessage, 
  onInitialMessageSent 
}: { 
  initialMessage?: string;
  onInitialMessageSent?: () => void;
}) {
  const { user, isAuthenticated, session } = useAuth();
  
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessage = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isLoadingHistory]);

  // Fetch History & Handle Initial Message
  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        let history: Message[] = [];

        if (data && data.length > 0) {
          history = data.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(history);
        } else {
          // Only show greeting if no history AND no initial message pending
          if (!initialMessage) {
            setMessages(INITIAL_MESSAGES);
          } else {
            setMessages([]); // Start empty if we are about to send a message
          }
        }
        setIsLoadingHistory(false);

        // Handle Initial Message (Auto-send)
        if (initialMessage && !hasSentInitialMessage.current) {
          hasSentInitialMessage.current = true;
          // Small delay to ensure state is ready
          setTimeout(() => {
            handleSendMessage(initialMessage);
            if (onInitialMessageSent) {
              onInitialMessageSent();
            }
          }, 500);
        }
      };
      fetchHistory();
    } else {
      // Not logged in
      setMessages(INITIAL_MESSAGES);
      setIsLoadingHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSendMessage = async (text: string) => {
    // Add user message locally (optimistic update)
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#024f86] to-[#3092bb] border-r border-white/10">
      {/* Header */}
      <div className="h-[97px] flex items-center px-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full relative overflow-hidden">
             {/* Using generic avatar or keeping existing logic if image source is dynamic */}
             <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-2xl">☁️</span>
             </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-[16px] font-normal text-white leading-[24px]">Cloudinha</h2>
            <p className="text-[14px] text-white/80 leading-[20px]">
              Assistente Virtual
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} userAvatar={user?.avatar} />
        ))}
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gray-400 text-sm p-3 bg-white/5 rounded-2xl w-fit"
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 px-6 pb-6 pt-4">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isTyping} />
      </div>
    </div>
  );
}
