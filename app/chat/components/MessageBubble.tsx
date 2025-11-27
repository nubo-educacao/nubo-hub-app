'use client';

import React from 'react';
import { Message } from './ChatCloudinha';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
  userAvatar?: string;
}

export default function MessageBubble({ message, userAvatar }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${
        isUser ? 'bg-purple-600' : 'bg-gradient-to-tr from-purple-500 to-pink-500'
      }`}>
        {isUser ? (
          userAvatar ? (
            <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">EU</span>
          )
        ) : (
          <span className="text-sm">☁️</span>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-md ${
        isUser 
          ? 'bg-purple-600 text-white rounded-br-none' 
          : 'bg-white/10 text-gray-100 border border-white/5 rounded-bl-none'
      }`}>
        {message.text}
        <div className={`text-[10px] mt-1 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}
