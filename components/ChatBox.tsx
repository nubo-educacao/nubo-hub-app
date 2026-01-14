'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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

  const PHRASES = [
    "Me ajude a encontrar a oportunidade ideal...",
    "Como funciona o processo do SISU?",
    "Tenho direito a bolsas do Prouni?",
    "Quais os documentos necessários para me matricular na faculdade?",
    "Como consigo uma vaga de Jovem Aprendiz?",
    "Me ajude a escolher um curso."
  ];

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
          
        {/* Left Action: Plus */}
        <button 
            disabled={!isAuthenticated}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-sky-50 transition-colors disabled:opacity-50 text-[#38B1E4] mb-1"
            aria-label="Adicionar anexo"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
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
