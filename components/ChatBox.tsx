'use client';

import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { PHRASES } from '@/components/ConversationStarters';

export default function ChatBox() {
  const { isAuthenticated, openAuthModal, setPendingAction, pendingAction } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Typewriter effect state
  const [placeholder, setPlaceholder] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const typingState = React.useRef({
    phraseIndex: 0,
    charIndex: 0,
    isDeleting: false,
  });
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [showStarters, setShowStarters] = useState(false);
  const startersRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Close starters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startersRef.current && 
        !startersRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowStarters(false);
      }
    };

    if (showStarters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStarters]);


  useEffect(() => {
    if (isInputFocused) {
      setPlaceholder("");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const animate = () => {
      const { phraseIndex, charIndex, isDeleting } = typingState.current;
      const currentPhrase = PHRASES[phraseIndex];
      let delay = 50;

      if (isDeleting) {
        if (charIndex > 0) {
          typingState.current.charIndex = charIndex - 1;
          setPlaceholder(currentPhrase.substring(0, typingState.current.charIndex) + "|");
          delay = 30;
        } else {
          typingState.current.isDeleting = false;
          typingState.current.phraseIndex = (phraseIndex + 1) % PHRASES.length;
          delay = 100; // Small pause before typing next
        }
      } else {
        if (charIndex < currentPhrase.length) {
          typingState.current.charIndex = charIndex + 1;
          setPlaceholder(currentPhrase.substring(0, typingState.current.charIndex) + "|");
          delay = 70; // Typing speed
        } else {
          typingState.current.isDeleting = true;
          delay = 2000; // Wait 2 seconds before deleting
        }
      }

      timeoutRef.current = setTimeout(animate, delay);
    };

    animate();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isInputFocused]);

  // Redirect to chat if logged in and has pending message (from this component)
  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'chat' && inputValue && pendingAction.payload.message === inputValue) {
       router.push('/chat');
    }
  }, [isAuthenticated, pendingAction, router, inputValue]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    if (isAuthenticated) {
      setIsLoading(true);
      setPendingAction({ type: 'chat', payload: { message: inputValue } });
      router.push('/chat');
    } else {
      setPendingAction({ type: 'chat', payload: { message: inputValue } });
      openAuthModal();
    }
  };

  const handleStarterClick = (phrase: string) => {
    setShowStarters(false);
    setPendingAction({ type: 'chat', payload: { message: phrase } });
    
    if (isAuthenticated) {
        router.push('/chat');
    } else {
        openAuthModal();
    }
  };

  const MAX_CHARS = 2000;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  
  return (
    <div className="w-full max-w-[785px] mx-auto px-2 md:px-4">
      <div className="relative bg-white flex items-end w-full min-h-[60px] md:min-h-[80px] px-3 md:px-4 rounded-[12px] md:rounded-[16px] shadow-[2px_2px_6px_0px_rgba(0,0,0,0.2)] md:shadow-[4px_4px_8px_0px_rgba(0,0,0,0.25)] gap-2 md:gap-4 py-2">
          
        {/* Conversation Starters Popup */}
        {showStarters && (
            <div 
                ref={startersRef}
                className="absolute bottom-full left-0 mb-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 px-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
                <div className="flex justify-between items-center px-3 py-1 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Sugestões
                    </span>
                    <button 
                        onClick={() => setShowStarters(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="flex flex-col gap-0.5">
                    {PHRASES.map((phrase, index) => (
                        <button
                            key={index}
                            onClick={() => handleStarterClick(phrase)}
                            className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-[#005F99] rounded-lg transition-colors mx-1"
                        >
                            {phrase}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Left Action: Plus */}
        <button 
            ref={toggleButtonRef}
            onClick={() => setShowStarters(!showStarters)}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors mb-1 ${showStarters ? 'bg-sky-100 text-[#005F99]' : 'hover:bg-sky-50 text-[#38B1E4]'}`}
            aria-label="Adicionar anexo"
        >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 transition-transform duration-200 ${showStarters ? 'rotate-45' : ''}`}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
            </svg>
        </button>

        {/* Textarea Field */}
        <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isInputFocused ? "" : placeholder}
            className="flex-1 bg-transparent text-[#3A424E] placeholder-[#3A424E]/50 focus:outline-none text-sm md:text-base font-medium py-3 md:py-4 resize-none min-h-[40px] max-h-[150px] overflow-y-auto"
            disabled={isLoading}
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 150) + 'px';
            }}
        />

        {/* Right Action: Send */}
        <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 mb-1 ${
                inputValue.trim() 
                ? 'bg-[#38B1E4] text-white hover:bg-[#2a9acb] shadow-sm' 
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
            aria-label="Enviar mensagem"
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="m5 12 7-7 7 7"/>
                    <path d="M12 19V5"/>
                </svg>
            )}
        </button>
      </div>

      {!isAuthenticated && (
        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-500">
            Você pode explorar o catálogo sem login, mas precisa <span onClick={openAuthModal} className="text-indigo-600 font-medium cursor-pointer hover:underline">entrar</span> para usar o chat.
          </p>
        </div>
      )}
    </div>
  );
}
