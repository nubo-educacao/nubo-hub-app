'use client';

import React from 'react';
import { Message } from './ChatCloudinha';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
          ? 'bg-[#38B1E4]/50 text-white rounded-br-none' 
          : 'bg-white/10 text-gray-100 border border-white/5 rounded-bl-none'
      }`}>
<div className="markdown-content">
            {message.text ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: (props: any) => <p className="mb-2 last:mb-0">{props.children}</p>,
                  strong: (props: any) => <strong className="font-bold">{props.children}</strong>,
                  ul: (props: any) => <ul className="list-disc ml-4 mb-2 space-y-1">{props.children}</ul>,
                  ol: (props: any) => <ol className="list-decimal ml-4 mb-2 space-y-1">{props.children}</ol>,
                  li: (props: any) => <li>{props.children}</li>,
                  a: (props: any) => (
                    <a 
                      href={props.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`underline ${isUser ? 'text-white' : 'text-purple-300 hover:text-purple-200'}`}
                    >
                      {props.children}
                    </a>
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
             !isUser && (
                <div className="flex items-center gap-1.5 py-2 px-1 h-[24px]">
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
             )
            )}
        </div>
        <div className={`text-[10px] mt-1 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}
