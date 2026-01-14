'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Message } from './ChatCloudinha';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  userAvatar?: string;
  onFeedback?: (score: number, type: string) => void;
}

export default function MessageBubble({ message, userAvatar, onFeedback }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);

  const handleFeedback = (score: number) => {
    if (feedbackScore === score) return; // Already selected
    setFeedbackScore(score);
    if (onFeedback) {
      onFeedback(score, 'explicit_thumb');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
    >
      <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar (Only for Cloudinha) */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm bg-white border border-gray-200">
            <Image 
              src="/assets/cloudinha.png" 
              alt="Cloudinha" 
              width={32} 
              height={32} 
              className="object-cover"
              quality={100}
            />
          </div>
        )}

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
               !isUser && (!message.course_ids || message.course_ids.length === 0) && (
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
      </div>

      {/* Feedback Actions (Only for Agent) */}
      {!isUser && message.text && (
        <div className="flex items-center gap-2 mt-1 ml-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <button 
             onClick={() => handleFeedback(1.0)}
             className={`p-1 rounded hover:bg-green-50 transition-colors ${feedbackScore === 1.0 ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
             title="Resposta útil"
           >
             <ThumbsUp className="w-3 h-3" />
           </button>
           <button 
             onClick={() => handleFeedback(-1.0)}
             className={`p-1 rounded hover:bg-red-50 transition-colors ${feedbackScore === -1.0 ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
             title="Não gostei"
           >
             <ThumbsDown className="w-3 h-3" />
           </button>
        </div>
      )}
    </motion.div>
  );
}
