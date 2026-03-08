'use client';

import React, { useState, KeyboardEvent, useEffect, useRef, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, Loader2, X, ArrowRight } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  passportPhase?: string | null;
  uiFormState?: any;
  onProfileUpdated?: () => void;
  onViewPanel?: () => void;
  showViewPanel?: boolean;
}

import { PHRASES } from '@/components/ConversationStarters';
import { updateUserProfileService } from '@/services/supabase/profile';

export default function ChatInput({ onSendMessage, isLoading, disabled, passportPhase, uiFormState, onProfileUpdated, onViewPanel, showViewPanel }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showStarters, setShowStarters] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated, openAuthModal, pendingAction, setPendingAction, clearPendingAction } = useAuth();
  const processedRef = useRef(false);
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

  // Phase INTRO transition auto-trigger
  useEffect(() => {
    if (passportPhase === 'INTRO' && isAuthenticated) {
      console.log('[ChatInput] INTRO phase detected. Starting 5s timer for auto-transition to ONBOARDING...');
      const timer = setTimeout(async () => {
        console.log('[ChatInput] 5s timer fired. Calling updateUserProfileService({ passport_phase: ONBOARDING })...');
        const result = await updateUserProfileService({ passport_phase: 'ONBOARDING' });
        console.log('[ChatInput] ✅ updateUserProfileService result:', result);
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [passportPhase, isAuthenticated, onProfileUpdated]);

  const MAX_CHARS = 2000;

  // Determine if input is blocked by phase
  const isPhaseBlocked = passportPhase === 'INTRO';
  const effectiveDisabled = disabled || isPhaseBlocked;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading || disabled) return;

    if (!isAuthenticated) {
      setPendingAction({ type: 'chat', payload: { message: inputValue } });
      openAuthModal();
      return;
    }

    startTransition(() => {
      onSendMessage(inputValue);
    });
    setInputValue('');
  };

  const handleStarterClick = (phrase: string) => {
    setShowStarters(false);
    if (!isAuthenticated) {
      setPendingAction({ type: 'chat', payload: { message: phrase } });
      openAuthModal();
      return;
    }

    startTransition(() => {
      onSendMessage(phrase);
    });
  };

  return (
    <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col gap-3">
      {/* Dependent Choice Buttons */}
      {passportPhase === 'ASK_DEPENDENT' && !isLoading && (
        <div className="w-full flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => onSendMessage('É para mim')}
            className="flex-1 py-4 px-6 bg-white hover:bg-sky-50 text-[#005F99] border-2 border-[#38B1E4] rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            É para mim
          </button>
          <button
            onClick={() => onSendMessage('Para outra pessoa')}
            className="flex-1 py-4 px-6 bg-[#38B1E4] hover:bg-[#2a9acb] text-white rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Para outra pessoa
          </button>
        </div>
      )}

      {/* View Panel Button (Mobile Only) */}
      {showViewPanel && !isLoading && (
        <div className="w-full flex justify-center md:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => {
              console.log('[ChatInput] onViewPanel called');
              onViewPanel?.();
            }}
            className="w-full py-4 px-6 bg-[#38B1E4]/80 backdrop-blur-md hover:bg-[#38B1E4] text-white border border-white/20 rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ring-1 ring-white/10"
          >
            <span>Ver painel</span>
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

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

      <div className={`flex items-end w-full bg-white border border-[#E3E8EF] rounded-[24px] px-2 py-2 shadow-lg gap-2 ${effectiveDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}>

        {/* Plus Button */}
        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setShowStarters(!showStarters)}
          disabled={effectiveDisabled}
          className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors mb-1 ${showStarters ? 'bg-sky-100 text-[#005F99]' : 'hover:bg-sky-50 text-[#38B1E4]'} ${effectiveDisabled ? 'pointer-events-none' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 transition-transform duration-200 ${showStarters ? 'rotate-45' : ''}`}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
        </button>

        <div className="flex-1">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={
              passportPhase === 'PROGRAM_MATCH' ? "Cloudinha está analisando as oportunidades..." :
                effectiveDisabled ? "Complete o cadastro para continuar..." :
                  isAuthenticated ? "Digite sua mensagem..." : "Faça login para conversar..."
            }
            disabled={isLoading || effectiveDisabled}
            className="w-full bg-transparent border-none text-[#374151] placeholder-gray-400 focus:outline-none focus:ring-0 text-[15px] px-2 py-3 min-h-[48px] max-h-[150px] resize-none overflow-y-auto disabled:cursor-not-allowed"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 150) + 'px';
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading || isPending}
          className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 mb-1 ${inputValue.trim()
            ? 'bg-[#38B1E4] hover:bg-[#2a9acb] text-white shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          {isLoading || isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} className="ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
