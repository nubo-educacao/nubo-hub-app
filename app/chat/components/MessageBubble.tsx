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
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm ${
        isUser ? 'bg-[#024F86]' : 'bg-white border border-gray-200'
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
      <div className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isUser 
          ? 'bg-[#024F86] text-white rounded-br-none' 
          : 'bg-white text-[#374151] border border-gray-100 rounded-bl-none'
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
                      className={`underline font-medium ${isUser ? 'text-white' : 'text-[#024F86] hover:text-[#023F6B]'}`}
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
                  <span className="w-1.5 h-1.5 bg-[#024F86]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#024F86]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#024F86]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
             )
            )}
        </div>
        <div className={`text-[10px] mt-1 opacity-60 ${isUser ? 'text-white/80 text-right' : 'text-[#636E7C] text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}
